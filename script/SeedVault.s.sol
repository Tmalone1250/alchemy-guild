// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/contracts/YieldVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SeedVault is Script {
    address constant WETH_ADDRESS = 0x980B62Da83eFf3D4576C647993b0c1D7faf17c73;
    address constant USDC_ADDRESS = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;
    
    // Using the recently deployed YieldVault address on Arbitrum Sepolia
    address payable constant VAULT_ADDRESS = payable(0x7a535fFd02d6C00F9131F31e435Ce5cf321bF9E6);

    function run() external {
        uint256 botPrivateKey = vm.envOr("BOT_PRIVATE_KEY", uint256(0));
        require(botPrivateKey != 0, "BOT_PRIVATE_KEY not set");
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        require(deployerPrivateKey != 0, "PRIVATE_KEY not set");
        
        vm.startBroadcast(botPrivateKey);

        // Deposit 0.4 WETH and 1600 USDC
        uint256 seedWeth = 400000000000000000;
        uint256 seedUsdc = 1600000000;

        IERC20(WETH_ADDRESS).transfer(VAULT_ADDRESS, seedWeth);
        IERC20(USDC_ADDRESS).transfer(VAULT_ADDRESS, seedUsdc);
        vm.stopBroadcast();
        
        vm.startBroadcast(deployerPrivateKey);
        YieldVault(VAULT_ADDRESS).executeRebalanceDirect(-200000, 200000);
        vm.stopBroadcast();
        
        console.log("Seeded Vault with 0.4 WETH and 1600 USDC");
    }
}
