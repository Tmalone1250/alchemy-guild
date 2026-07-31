// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ISwapRouter, INonfungiblePositionManager, IUniswapV3Pool} from "./IUniswap.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {ElementNFT} from "./ElementNFT.sol";
import {Nox, eint256, externalEint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";

// SafeERC20 Wrapper to avoid Import Issues
library SafeTransferLib {
    function safeTransfer(IERC20 token, address to, uint256 amount) internal {
        (bool success, bytes memory data) = address(token).call(abi.encodeWithSelector(IERC20.transfer.selector, to, amount));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }
}

interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

interface IYieldVault_GuildDistributor {
    function notifyRewardAmount(uint256 amount) external;
}

contract YieldVault is IERC721Receiver, ReentrancyGuard, Ownable {
    using SafeTransferLib for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;
    // Interface IERC721Receiver for minting/managing Uniswap V3 LP positions and Uniswap V3 for rebalancing
    INonfungiblePositionManager public immutable POSITION_MANAGER;
    ISwapRouter public immutable SWAP_ROUTER;
    IUniswapV3Pool public immutable POOL;
    IEntryPoint public immutable ENTRY_POINT;
    ElementNFT public I_ELEMENT_NFT;

    // Events
    event Staked(
        address indexed user,
        uint256 indexed tokenId,
        uint8 tier,
        uint256 weight
    );
    event Unstaked(
        address indexed user,
        uint256 indexed tokenId,
        uint256 reward
    );
    event YieldClaimed(
        address indexed user,
        uint256 indexed tokenId,
        uint256 reward
    );
    event ElementNFTSet(address indexed elementNFT);
    event Harvested(uint256 wethSwapped, uint256 guildSwapped, uint256 usdtSwapped, uint256 usdcInjected);

    // Constants - scale factor (1e18) and tier weights (100, 135, 175)
    uint256 private constant SCALE_FACTOR = 1e18;
    uint256 private constant TIER1_WEIGHT = 100;
    uint256 private constant TIER2_WEIGHT = 135;
    uint256 private constant TIER3_WEIGHT = 175;

    // Global state variables
    uint256 public sTotalWeight;
    uint256 public sAccRewardPerWeight;
    uint256[] public activePositions;
    uint256 public sTotalUnclaimedYield;

    // Nox confidential variables
    eint256 public sEncryptedTickLower;
    eint256 public sEncryptedTickUpper;
    bool public sPendingRebalance;
    // WETH Interface extended to include deposit
    IERC20 public immutable WETH;
    IERC20 public immutable USDC;
    address public immutable PAYMASTER;

    IERC20 public GUILD;
    IERC20 public USDT;
    IYieldVault_GuildDistributor public DISTRIBUTOR;

    // Mappings
    mapping(uint256 => address) public sNftOwner;
    mapping(uint256 => uint256) public sRewardDebt;
    mapping(uint256 => uint8) public sStakedTier;
    mapping(address => EnumerableSet.UintSet) private sUserStakedTokens;

    // Constructor
    constructor(
        address _positionManager,
        address _swapRouter,
        address _pool,
        address _weth,
        address _usdc,
        address _paymaster,
        address _entryPoint
    ) Ownable(msg.sender) {
        POSITION_MANAGER = INonfungiblePositionManager(_positionManager);
        SWAP_ROUTER = ISwapRouter(_swapRouter);
        POOL = IUniswapV3Pool(_pool);
        WETH = IERC20(_weth);
        USDC = IERC20(_usdc);
        PAYMASTER = _paymaster;
        ENTRY_POINT = IEntryPoint(_entryPoint);
    }

    // Set ElementNFT address (Circular Dependency Resolution)
    function setElementNFT(address _elementNFT) external onlyOwner {
        require(_elementNFT != address(0), "Invalid address");
        I_ELEMENT_NFT = ElementNFT(_elementNFT);
        emit ElementNFTSet(_elementNFT);
    }

    // Set ecosystem addresses
    function setEcosystemTokens(address _guild, address _usdt, address _distributor) external onlyOwner {
        GUILD = IERC20(_guild);
        USDT = IERC20(_usdt);
        DISTRIBUTOR = IYieldVault_GuildDistributor(_distributor);
    }

    // Receive function to wrap ETH to WETH
    receive() external payable {
        if (msg.sender != address(WETH) && msg.value > 0) {
            IWETH(address(WETH)).deposit{value: msg.value}();
        }
    }

    function getTierWeight(uint8 tier) internal pure returns (uint256) {
        if (tier == 1) return TIER1_WEIGHT;
        if (tier == 2) return TIER2_WEIGHT;
        if (tier == 3) return TIER3_WEIGHT;
        revert("Invalid tier");
    }

    function stake(uint256 tokenId, uint8 tier) external nonReentrant {
        require(tier >= 1 && tier <= 3, "Invalid tier");
        require(I_ELEMENT_NFT.getTokenTier(tokenId) == tier, "Tier mismatch");

        I_ELEMENT_NFT.safeTransferFrom(msg.sender, address(this), tokenId);
        sRewardDebt[tokenId] = sAccRewardPerWeight;
        uint256 weight = getTierWeight(tier);
        sTotalWeight += weight;
        sNftOwner[tokenId] = msg.sender;
        sStakedTier[tokenId] = tier;
        sUserStakedTokens[msg.sender].add(tokenId);

        emit Staked(msg.sender, tokenId, tier, weight);
    }

    function unstake(uint256 tokenId) external nonReentrant {
        require(sNftOwner[tokenId] == msg.sender, "Not the owner");

        uint256 weight = getTierWeight(sStakedTier[tokenId]);
        uint256 pendingReward = (weight * (sAccRewardPerWeight - sRewardDebt[tokenId])) / SCALE_FACTOR;

        sTotalWeight -= weight;
        delete sNftOwner[tokenId];
        delete sRewardDebt[tokenId];
        delete sStakedTier[tokenId];
        sUserStakedTokens[msg.sender].remove(tokenId);

        I_ELEMENT_NFT.safeTransferFrom(address(this), msg.sender, tokenId);

        if (pendingReward > 0) {
            if (sTotalUnclaimedYield >= pendingReward) {
                sTotalUnclaimedYield -= pendingReward;
            } else {
                sTotalUnclaimedYield = 0; 
            }
            USDC.safeTransfer(msg.sender, pendingReward);
        }
        emit Unstaked(msg.sender, tokenId, pendingReward);
    }

    // Generic Swap Helper
    function _attemptSwap(address tokenIn, address tokenOut, uint256 amountIn, uint24 fee) internal returns (uint256) {
        if (amountIn == 0) return 0;
        
        IERC20(tokenIn).approve(address(SWAP_ROUTER), amountIn);
        
        ISwapRouter.ExactInputSingleParams memory swapParams = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: address(this),
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });
        
        return SWAP_ROUTER.exactInputSingle(swapParams);
    }

    // Harvest And Distribute
    function harvestAndDistribute() external nonReentrant {
        uint256 length = activePositions.length;
        require(length > 0, "No active positions");

        uint256 usdcBefore = USDC.balanceOf(address(this));

        // 1. Collect fees from all active positions
        for (uint256 i = 0; i < length; i++) {
            POSITION_MANAGER.collect(
                INonfungiblePositionManager.CollectParams({
                    tokenId: activePositions[i],
                    recipient: address(this),
                    amount0Max: type(uint128).max,
                    amount1Max: type(uint128).max
                })
            );
        }

        // 2. Swap collected tokens to USDC
        uint256 wethCollected = WETH.balanceOf(address(this));
        if (wethCollected > 0) {
            _attemptSwap(address(WETH), address(USDC), wethCollected, 3000); // WETH/USDC is 0.3%
        }

        uint256 guildCollected = address(GUILD) != address(0) ? GUILD.balanceOf(address(this)) : 0;
        if (guildCollected > 0) {
            _attemptSwap(address(GUILD), address(WETH), guildCollected, 10000); // GUILD/WETH is 1%
        }

        uint256 usdtCollected = address(USDT) != address(0) ? USDT.balanceOf(address(this)) : 0;
        if (usdtCollected > 0) {
            _attemptSwap(address(USDT), address(USDC), usdtCollected, 500); // USDT/USDC is 0.05%
        }

        // Re-check WETH balance after GUILD->WETH swap
        uint256 wethFinal = WETH.balanceOf(address(this));
        if (wethFinal > 0) {
            _attemptSwap(address(WETH), address(USDC), wethFinal, 3000);
        }

        // 3. Inject all new USDC into the Waterfall
        uint256 usdcAfter = USDC.balanceOf(address(this));
        uint256 collectedUsdc = usdcAfter > usdcBefore ? usdcAfter - usdcBefore : 0;

        if (collectedUsdc > 0 && address(DISTRIBUTOR) != address(0)) {
            // Calculate Paymaster Tax (10%)
            uint256 paymasterTax = (collectedUsdc * 10) / 100;
            uint256 distributorShare = collectedUsdc - paymasterTax;

            if (paymasterTax > 0) {
                USDC.safeTransfer(PAYMASTER, paymasterTax);
            }

            if (distributorShare > 0) {
                if (sTotalWeight > 0) {
                    sAccRewardPerWeight += (distributorShare * SCALE_FACTOR) / sTotalWeight;
                }
            }
            emit Harvested(wethCollected + wethFinal, guildCollected, usdtCollected, collectedUsdc);
        }
    }

    function claimYield(uint256 tokenId) external nonReentrant {
        require(sNftOwner[tokenId] == msg.sender, "Not the owner");
        uint256 weight = getTierWeight(sStakedTier[tokenId]);
        uint256 pendingReward = (weight * (sAccRewardPerWeight - sRewardDebt[tokenId])) / SCALE_FACTOR;
        require(pendingReward > 0, "No rewards to claim");

        sRewardDebt[tokenId] = sAccRewardPerWeight;
        uint256 availableUsdc = USDC.balanceOf(address(this));
        uint256 rewardToPay = pendingReward > availableUsdc ? availableUsdc : pendingReward;
        
        require(rewardToPay > 0, "No USDC available in vault");
        if (sTotalUnclaimedYield >= rewardToPay) {
            sTotalUnclaimedYield -= rewardToPay;
        } else {
            sTotalUnclaimedYield = 0;
        }
        
        USDC.safeTransfer(msg.sender, rewardToPay);
        emit YieldClaimed(msg.sender, tokenId, rewardToPay);
    }

    function getPendingReward(uint256 tokenId) external view returns (uint256) {
        uint256 weight = getTierWeight(sStakedTier[tokenId]);
        return (weight * (sAccRewardPerWeight - sRewardDebt[tokenId])) / SCALE_FACTOR;
    }

    function getUserStakedTokens(address user) external view returns (uint256[] memory) {
        uint256 count = sUserStakedTokens[user].length();
        uint256[] memory tokens = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            tokens[i] = sUserStakedTokens[user].at(i);
        }
        return tokens;
    }

    function onERC721Received(
        address,
        address,
        uint256 tokenId,
        bytes calldata
    ) external override returns (bytes4) {
        if (msg.sender == address(POSITION_MANAGER)) {
            activePositions.push(tokenId);
        }
        return IERC721Receiver.onERC721Received.selector;
    }

    // Dummy for backward compatibility with older deployment scripts
    function executeRebalanceDirect(int24 tickLower, int24 tickUpper) external onlyOwner {
        // No-op for now, replaced by harvestAndDistribute and seed scripts
    }
}
