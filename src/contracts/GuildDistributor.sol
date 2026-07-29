// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

interface IElementNFT {
    function getTokenTier(uint256 tokenId) external view returns (uint8);
}

contract GuildDistributor is Ownable, IERC721Receiver {
    using EnumerableSet for EnumerableSet.UintSet;

    IERC20 public immutable guildToken;
    IERC20 public usdc;
    address public elementNFT;
    address public alchemist;
    address public yieldVault;
    uint256 public guildPriceUSD = 0.77 ether;

    // Equivalents to spec limits
    uint8 public constant MAX_TIER1 = 3;
    uint8 public constant MAX_TIER2 = 3;
    uint8 public constant MAX_TIER3 = 1;

    mapping(address => uint8) public stakedLeadCount;
    mapping(address => uint8) public stakedSilverCount;
    mapping(address => uint8) public stakedGoldCount;

    uint256 public unallocatedUsdc;

    // Synthetix-style variables
    uint256 public totalWeightT1;
    uint256 public totalWeightT2;
    uint256 public totalWeightT3;

    uint256 public rewardPerWeightPool1;
    uint256 public rewardPerWeightPool2;
    uint256 public rewardPerWeightPool3;

    mapping(uint256 => uint256) public userRewardPerTokenPaid;
    mapping(uint256 => uint256) public rewards;
    mapping(uint256 => address) public staker;
    mapping(address => EnumerableSet.UintSet) private userStakedTokens;

    event RewardDistributed(address indexed user, uint256 amount);
    event RewardSkipped(address indexed user, uint256 amount, string reason);
    event ContractsUpdated(address elementNFT, address alchemist);
    event Staked(address indexed user, uint256 tokenId, uint8 tier, uint256 weight);
    event Withdrawn(address indexed user, uint256 tokenId, uint8 tier, uint256 weight);
    event RewardPaid(address indexed user, uint256 reward);

    constructor(address _guildToken) Ownable(msg.sender) {
        require(_guildToken != address(0), "Invalid token address");
        guildToken = IERC20(_guildToken);
    }

    function setUsdc(address _usdc) external onlyOwner {
        usdc = IERC20(_usdc);
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == elementNFT || msg.sender == alchemist,
            "GuildDistributor: Not authorized"
        );
        _;
    }

    function setContracts(
        address _elementNFT,
        address _alchemist,
        address _yieldVault
    ) external onlyOwner {
        elementNFT = _elementNFT;
        alchemist = _alchemist;
        yieldVault = _yieldVault;
        emit ContractsUpdated(_elementNFT, _alchemist);
    }

    function setGuildPriceUSD(uint256 _newPrice) external onlyOwner {
        guildPriceUSD = _newPrice;
    }

    /**
     * @notice Distributes GUILD rewards to users when minting or crafting.
     */
    function rewardUser(
        address user,
        uint256 targetUsdValue
    ) external onlyAuthorized {
        if (user == address(0) || targetUsdValue == 0) {
            return;
        }

        uint256 rewardAmount = (targetUsdValue * 1e18) / guildPriceUSD;

        uint256 balance = guildToken.balanceOf(address(this));
        if (balance < rewardAmount) {
            emit RewardSkipped(user, rewardAmount, "Insufficient distributor balance");
            return;
        }

        try guildToken.transfer(user, rewardAmount) returns (bool success) {
            if (success) {
                emit RewardDistributed(user, rewardAmount);
            } else {
                emit RewardSkipped(user, rewardAmount, "Transfer returned false");
            }
        } catch {
            emit RewardSkipped(user, rewardAmount, "Transfer reverted");
        }
    }

    // ==========================================
    // STAKING LOGIC
    // ==========================================

    function getTierWeight(uint8 tier) public pure returns (uint256) {
        if (tier == 1) return 100;
        if (tier == 2) return 135;
        if (tier == 3) return 175;
        return 0;
    }

    function getAccumulator(uint8 tier) public view returns (uint256) {
        if (tier == 1) return rewardPerWeightPool1;
        if (tier == 2) return rewardPerWeightPool1 + rewardPerWeightPool2;
        if (tier == 3) return rewardPerWeightPool1 + rewardPerWeightPool2 + rewardPerWeightPool3;
        return 0;
    }

    function stake(uint256 tokenId) external {
        uint8 tier = IElementNFT(elementNFT).getTokenTier(tokenId);
        require(tier >= 1 && tier <= 3, "Invalid tier");

        if (tier == 1) {
            require(stakedLeadCount[msg.sender] < MAX_TIER1, "Max Tier 1 reached");
            stakedLeadCount[msg.sender]++;
        } else if (tier == 2) {
            require(stakedSilverCount[msg.sender] < MAX_TIER2, "Max Tier 2 reached");
            stakedSilverCount[msg.sender]++;
        } else if (tier == 3) {
            require(stakedGoldCount[msg.sender] < MAX_TIER3, "Max Tier 3 reached");
            stakedGoldCount[msg.sender]++;
        }

        // 1. Update reward debt with accumulator BEFORE dispersing unallocated yield
        _updateReward(tokenId, tier);

        uint256 weight = getTierWeight(tier);
        if (tier == 1) totalWeightT1 += weight;
        else if (tier == 2) totalWeightT2 += weight;
        else if (tier == 3) totalWeightT3 += weight;

        // 2. Disperse unallocated USDC if any exists now that weights are updated
        if (unallocatedUsdc > 0) {
            uint256 toDisperse = unallocatedUsdc;
            unallocatedUsdc = 0;
            _distributeAmount(toDisperse);
        }

        staker[tokenId] = msg.sender;
        userStakedTokens[msg.sender].add(tokenId);

        IERC721(elementNFT).safeTransferFrom(msg.sender, address(this), tokenId);
        emit Staked(msg.sender, tokenId, tier, weight);
    }

    function withdraw(uint256 tokenId) external {
        require(staker[tokenId] == msg.sender, "Not staker");
        uint8 tier = IElementNFT(elementNFT).getTokenTier(tokenId);

        // Update and save pending rewards
        _updateReward(tokenId, tier);

        if (tier == 1) stakedLeadCount[msg.sender]--;
        else if (tier == 2) stakedSilverCount[msg.sender]--;
        else if (tier == 3) stakedGoldCount[msg.sender]--;

        uint256 weight = getTierWeight(tier);
        if (tier == 1) totalWeightT1 -= weight;
        else if (tier == 2) totalWeightT2 -= weight;
        else if (tier == 3) totalWeightT3 -= weight;

        staker[tokenId] = address(0);
        userStakedTokens[msg.sender].remove(tokenId);

        IERC721(elementNFT).safeTransferFrom(address(this), msg.sender, tokenId);
        emit Withdrawn(msg.sender, tokenId, tier, weight);
    }

    function _updateReward(uint256 tokenId, uint8 tier) internal {
        if (staker[tokenId] != address(0)) {
            rewards[tokenId] = earned(tokenId);
        }
        userRewardPerTokenPaid[tokenId] = getAccumulator(tier);
    }

    function earned(uint256 tokenId) public view returns (uint256) {
        if (staker[tokenId] == address(0)) return rewards[tokenId];
        uint8 tier = IElementNFT(elementNFT).getTokenTier(tokenId);
        uint256 weight = getTierWeight(tier);
        uint256 currentAccumulator = getAccumulator(tier);
        
        return (weight * (currentAccumulator - userRewardPerTokenPaid[tokenId])) / 1e18 + rewards[tokenId];
    }

    function earnedUser(address user) public view returns (uint256) {
        uint256 totalEarned = 0;
        EnumerableSet.UintSet storage tokens = userStakedTokens[user];
        uint256 length = tokens.length();
        for (uint256 i = 0; i < length; i++) {
            totalEarned += earned(tokens.at(i));
        }
        return totalEarned;
    }

    function getUserStakedTokens(address user) external view returns (uint256[] memory) {
        return userStakedTokens[user].values();
    }

    function getReward() public {
        uint256 reward = 0;
        EnumerableSet.UintSet storage tokens = userStakedTokens[msg.sender];
        uint256 length = tokens.length();
        for (uint256 i = 0; i < length; i++) {
            uint256 tokenId = tokens.at(i);
            uint8 tier = IElementNFT(elementNFT).getTokenTier(tokenId);
            _updateReward(tokenId, tier);
            
            reward += rewards[tokenId];
            rewards[tokenId] = 0;
        }

        if (reward > 0) {
            usdc.transfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function claimAll() external {
        getReward();
    }

    function _distributeAmount(uint256 amount) internal {
        if (amount == 0) return;
        uint256 totalAll = totalWeightT1 + totalWeightT2 + totalWeightT3;
        if (totalAll == 0) {
            unallocatedUsdc += amount;
            return;
        }

        uint256 pool1Amount = (amount * 50) / 100;
        uint256 pool2Amount = (amount * 30) / 100;
        uint256 pool3Amount = amount - pool1Amount - pool2Amount;

        rewardPerWeightPool1 += (pool1Amount * 1e18) / totalAll;

        uint256 totalT2T3 = totalWeightT2 + totalWeightT3;
        if (totalT2T3 > 0) {
            rewardPerWeightPool2 += (pool2Amount * 1e18) / totalT2T3;
        }

        if (totalWeightT3 > 0) {
            rewardPerWeightPool3 += (pool3Amount * 1e18) / totalWeightT3;
        }
    }

    // Emergency Fallback and Yield Injection
    function notifyRewardAmount(uint256 amount) external {
        require(msg.sender == owner() || msg.sender == yieldVault, "Not authorized to inject yield");
        require(amount > 0, "Zero amount");
        usdc.transferFrom(msg.sender, address(this), amount);

        _distributeAmount(amount);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
