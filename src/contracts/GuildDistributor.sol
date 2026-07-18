// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract GuildDistributor is Ownable {
    IERC20 public immutable guildToken;
    address public elementNFT;
    address public alchemist;

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

    /**
     * @notice Distributes GUILD rewards to users when minting or crafting.
     * @dev Un-brickable safety check: if the distributor balance is lower than `amount`,
     * or if the token transfer fails, it catches the error and exits cleanly without throwing
     * a revert. This prevents core gameplay loops (mint/craft) from ever freezing.
     */
    function rewardUser(
        address user,
        uint256 amount
    ) external onlyAuthorized {
        if (user == address(0) || amount == 0) {
            return;
        }

        uint256 balance = guildToken.balanceOf(address(this));
        if (balance < amount) {
            emit RewardSkipped(user, amount, "Insufficient distributor balance");
            return;
        }

        try guildToken.transfer(user, amount) returns (bool success) {
            if (success) {
                emit RewardDistributed(user, amount);
            } else {
                emit RewardSkipped(user, amount, "Transfer returned false");
            }
        } catch {
            emit RewardSkipped(user, amount, "Transfer reverted");
        }
    }
}
