// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../src/contracts/YieldVault.sol";

contract DeployNewYieldVault is Script {
    function run() external {
        // Load Private Key from .env
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Configuration Addresses (Arbitrum Sepolia - chainId: 421614)
        address positionManager = 0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65; // NonfungiblePositionManager
        address swapRouter      = 0x101F443B4d1b059569D643917553c771E1b9663E; // SwapRouter02
        
        // Project Addresses
        address pool = 0x66EEAB70aC52459Dd74C6AD50D578Ef76a441bbf; // USDC/WETH 0.3% Pool on Arbitrum Sepolia
        address weth = 0x980B62Da83eFf3D4576C647993b0c1D7faf17c73;
        address usdc = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;
        address paymaster = 0xa9924829148A1a1Bd057EAC11B448084cDCbC60a; // Correct Alchemy Paymaster
        
        // Account Abstraction v0.6 EntryPoint (Standard across EVM chains)
        address entryPoint = 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789; 

        console.log("-----------------------------------------");
        console.log("Deploying New YieldVault on Arbitrum Sepolia (421614)...");
        console.log("PositionManager:", positionManager);
        console.log("SwapRouter:", swapRouter);
        console.log("Pool:", pool);

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
