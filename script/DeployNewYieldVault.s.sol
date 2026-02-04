// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../src/contracts/YieldVault.sol";

contract DeployNewYieldVault is Script {
    function run() external {
        // Load Private Key from .env
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Configuration Addresses (Sepolia)
        address positionManager = 0x1238536071E1c677A632429e3655c799b22cDA52; // Correct Sepolia Address
        address swapRouter = 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E;
        
        // Project Addresses
        address pool = 0x6Ce0896eAE6D4BD668fDe41BB784548fb8F59b50; // USDC/WETH 0.3%
        address weth = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
        address usdc = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
        address paymaster = 0x353A1d7795bAdA4727179c09216b0e7DEE8B83D3; // Alchemy Paymaster
        
        // Account Abstraction v0.6 EntryPoint (Standard)
        address entryPoint = 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789; 

        console.log("-----------------------------------------");
        console.log("Deploying New YieldVault with Auto-Recycling...");
        console.log("Paymaster:", paymaster);
        console.log("EntryPoint:", entryPoint);

        YieldVault vault = new YieldVault(
            positionManager,
            swapRouter,
            pool,
            weth,
            usdc,
            paymaster,
            entryPoint
        );

        console.log("-----------------------------------------");
        console.log(unicode"✅ New YieldVault Deployed at:", address(vault));
        console.log("-----------------------------------------");

        vm.stopBroadcast();
    }
}
