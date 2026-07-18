// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract GuildDistributor is Ownable {
    IERC20 public immutable guildToken;
    address public elementNFT;
    address public alchemist;
    uint256 public guildPriceUSD = 0.77 ether;

    event RewardDistributed(address indexed user, uint256 amount);
    event RewardSkipped(address indexed user, uint256 amount, string reason);
    event ContractsUpdated(address elementNFT, address alchemist);

    constructor(address _guildToken) Ownable(msg.sender) {
        require(_guildToken != address(0), "Invalid token address");
        guildToken = IERC20(_guildToken);
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
        address _alchemist
    ) external onlyOwner {
        elementNFT = _elementNFT;
        alchemist = _alchemist;
        emit ContractsUpdated(_elementNFT, _alchemist);
    }

    function setGuildPriceUSD(uint256 _newPrice) external onlyOwner {
        guildPriceUSD = _newPrice;
    }

    /**
     * @notice Distributes GUILD rewards to users when minting or crafting.
     * @dev Un-brickable safety check: if the distributor balance is lower than `amount`,
     * or if the token transfer fails, it catches the error and exits cleanly without throwing
     * a revert. This prevents core gameplay loops (mint/craft) from ever freezing.
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
}
