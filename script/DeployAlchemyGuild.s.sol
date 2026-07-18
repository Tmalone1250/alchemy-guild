// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/contracts/YieldVault.sol";
import "../src/contracts/ElementNFT.sol";
import "../src/contracts/AlchemistContract.sol";
import "../src/contracts/AlchemyPaymaster.sol";

contract DeployAlchemyGuild is Script {
    // ── Canonical Arbitrum Sepolia Addresses (Chain ID: 421614) ───────────────────
    address constant UNISWAP_V3_FACTORY          = 0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e;
    address constant UNISWAP_V3_POSITION_MANAGER = 0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65;
    address constant SWAP_ROUTER                 = 0x101F443B4d1b059569D643917553c771E1b9663E;
    address constant WETH                        = 0x980B62Da83eFf3D4576C647993b0c1D7faf17c73;
    address constant USDC                        = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;
    address constant UNISWAP_POOL                = 0x66EEAB70aC52459Dd74C6AD50D578Ef76a441bbf; // WETH/USDC 0.3%
    address constant ENTRY_POINT                 = 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789;

    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        address deployer;
        if (deployerPrivateKey != 0) {
            deployer = vm.addr(deployerPrivateKey);
            vm.startBroadcast(deployerPrivateKey);
        } else {
            deployer = msg.sender;
            vm.startBroadcast();
        }

        console.log("=================================================");
        console.log("DEPLOYING ALCHEMY GUILD PROTOCOL ON ARBITRUM SEPOLIA");
        console.log("Deployer Address:", deployer);
        console.log("=================================================");

        // 1. Deploy AlchemyPaymaster
        AlchemyPaymaster paymaster = new AlchemyPaymaster(
            IEntryPoint(ENTRY_POINT),
            deployer
        );
        console.log("AlchemyPaymaster Deployed:", address(paymaster));

        // 2. Deploy YieldVault
        YieldVault vault = new YieldVault(
            UNISWAP_V3_POSITION_MANAGER,
            SWAP_ROUTER,
            UNISWAP_POOL,
            WETH,
            USDC,
            address(paymaster),
            ENTRY_POINT
        );
        console.log("YieldVault Deployed:", address(vault));

        // 3. Deploy ElementNFT
        ElementNFT nft = new ElementNFT(deployer);
        console.log("ElementNFT Deployed:", address(nft));

        // 4. Link NFT to Vault
        vault.setElementNFT(address(nft));
        console.log("Linked ElementNFT to YieldVault");

        // 5. Transfer YieldVault Ownership to Bot Wallet
        address botWallet = vm.envOr("BOT_WALLET", address(0x8D84bcFfc08E9a9C88d64d6680549Ab1919032A0));
        vault.transferOwnership(botWallet);
        console.log("Transferred YieldVault ownership to Bot Wallet:", botWallet);

        console.log("=================================================");
        console.log("DEPLOYMENT COMPLETE ON ARBITRUM SEPOLIA");
        console.log("=================================================");

        vm.stopBroadcast();
    }
}
