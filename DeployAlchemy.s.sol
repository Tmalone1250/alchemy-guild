// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {ElementNFT} from "../src/ElementNFT.sol";
import {AlchemistContract} from "../src/AlchemistContract.sol";
import {YieldVault} from "../src/YieldVault.sol";
import {AlchemistTreasury} from "../src/AlchemistTreasury.sol";

contract DeployAlchemy is Script {
    // Sepolia Network Addresses (Standard Uniswap V3)
    address constant POSITION_MANAGER =
        0x1238536071E1c677A632429e3655c799b22cDA52;
    address constant SWAP_ROUTER = 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E;
    address constant WETH_USDC_POOL =
        0x6Ce0896eAE6D4BD668fDe41BB784548fb8F59b50;
    address constant WETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
    address constant USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;

    function run() external {
        // Fetch private key from .env
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        // address deployerAddress = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy the Treasury (The Gas Tank)
        AlchemistTreasury treasury = new AlchemistTreasury();

        // 2. Deploy the NFT (The Base Matter) with Treasury reference
        ElementNFT nft = new ElementNFT(address(treasury));

        // 3. Deploy the Alchemist (The Evolution Engine) with Treasury reference
        AlchemistContract alchemist = new AlchemistContract(
            address(nft),
            address(treasury)
        );

        // 4. Deploy the YieldVault (The Gold Generator)
        YieldVault vault = new YieldVault(
            POSITION_MANAGER,
            SWAP_ROUTER,
            WETH_USDC_POOL,
            address(nft),
            WETH,
            USDC,
            address(treasury) // Passing Treasury as the Paymaster
        );

        // 5. Grant Roles (The "Glue")
        // We give the Alchemist and Vault the MINTER_ROLE so they can
        // evolve and reward users by managing the NFTs.
        bytes32 minterRole = nft.MINTER_ROLE();
        nft.grantRole(minterRole, address(alchemist));
        nft.grantRole(minterRole, address(vault));

        // Grant BURNER_ROLE to Alchemist so it can burn ingredients during crafting
        bytes32 burnerRole = nft.BURNER_ROLE();
        nft.grantRole(burnerRole, address(alchemist));

        console.log("Alchemy Ecosystem Deployed!");
        console.log("Treasury:", address(treasury));
        console.log("ElementNFT:", address(nft));
        console.log("Alchemist:", address(alchemist));
        console.log("YieldVault:", address(vault));

        vm.stopBroadcast();
    }
}
