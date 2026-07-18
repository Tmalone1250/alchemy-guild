// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GuildToken
 * @notice Fixed-supply Protocol DAO Token (100,000,000 GUILD) for Alchemy Guild.
 * @dev Allocates 20% (20,000,000 GUILD) directly to the YieldVault upon deployment,
 * and 80% (80,000,000 GUILD) directly to the DAO Treasury.
 */
contract GuildToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant TOTAL_SUPPLY = 100_000_000 * 10**18;
    uint256 public constant VAULT_ALLOCATION = 20_000_000 * 10**18;
    uint256 public constant TREASURY_ALLOCATION = TOTAL_SUPPLY - VAULT_ALLOCATION;

    constructor(address yieldVault, address treasury) ERC20("Alchemy Guild Token", "GUILD") Ownable(msg.sender) {
        require(yieldVault != address(0), "Invalid vault address");
        require(treasury != address(0), "Invalid treasury address");

        _mint(yieldVault, VAULT_ALLOCATION);
        _mint(treasury, TREASURY_ALLOCATION);
    }
}
