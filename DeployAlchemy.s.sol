// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {ElementNFT} from "./src/contracts/ElementNFT.sol";
import {AlchemistContract} from "./src/contracts/AlchemistContract.sol";
import {YieldVault} from "./src/contracts/YieldVault.sol";

contract DeployAlchemy is Script {
    // Sepolia Network Addresses (Standard Uniswap V3)
    address constant POSITION_MANAGER =
        0x1238536071E1c677A632429e3655c799b22cDA52;
    address constant SWAP_ROUTER = 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E;
    address constant WETH_USDC_POOL =
        0x6Ce0896eAE6D4BD668fDe41BB784548fb8F59b50;
    address constant WETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
    address constant USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;

    address constant PAYMASTER_ADDRESS = 0x353A1d7795bAdA4727179c09216b0e7DEE8B83D3;

    function run() external {
        // Fetch private key from .env
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy the YieldVault (Now acting as the Treasury)
        // We pass the global Paymaster address for tax distribution
        YieldVault vault = new YieldVault(
            POSITION_MANAGER,
            SWAP_ROUTER,
            WETH_USDC_POOL,
            WETH,
            USDC,
            PAYMASTER_ADDRESS
        );

        // 2. Deploy the NFT (The Base Matter)
        // Set YieldVault as the 'Treasury' to receive the 0.002 ETH fees
        ElementNFT nft = new ElementNFT(address(vault));

        // 3. Deploy the Alchemist (The Evolution Engine)
        // Set YieldVault as the 'Treasury' here too
        AlchemistContract alchemist = new AlchemistContract(
            address(nft),
            address(vault)
        );

        // 4. Link the Vault to the NFT (Circular Dependency Resolution)
        vault.setElementNFT(address(nft));


        // 5. Grant Roles
        // Grant MINTER_ROLE to Alchemist and Vault
        bytes32 minterRole = nft.MINTER_ROLE();
        nft.grantRole(minterRole, address(alchemist));
        nft.grantRole(minterRole, address(vault));

        // Grant BURNER_ROLE to Alchemist
        bytes32 burnerRole = nft.BURNER_ROLE();
        nft.grantRole(burnerRole, address(alchemist));

        console.log("Alchemy Ecosystem Deployed (V2 - YieldVault is Treasury)!");
        console.log("YieldVault:", address(vault));
        console.log("ElementNFT:", address(nft));
        console.log("Alchemist:", address(alchemist));
        console.log("Paymaster:", PAYMASTER_ADDRESS);

        vm.stopBroadcast();
    }
}
