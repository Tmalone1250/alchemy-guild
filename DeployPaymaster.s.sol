// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {AlchemyPaymaster} from "../src/AlchemyPaymaster.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

contract DeployPaymaster is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // EntryPoint v0.7 on Sepolia
        address entryPoint = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;

        // Deploy Contract
        AlchemyPaymaster paymaster = new AlchemyPaymaster(
            IEntryPoint(entryPoint),
            msg.sender // owner
        );

        // Set Whitelisted Contracts (Replace with ACTUAL addresses from current deployment)
        address nftAddress = 0x05af7195c80a8276fcc8242A574A1B981C965259;
        address alchemistAddress = 0x51Ea2098D71104e76c1A64969243764506509f63;
        address vaultAddress = 0x77c277717088C3Bc3b379A09873d6b1d1A0BEe10;

        paymaster.setSponsoredContract(nftAddress, true);
        paymaster.setSponsoredContract(alchemistAddress, true);
        paymaster.setSponsoredContract(vaultAddress, true);

        console.log("New Paymaster Deployed:", address(paymaster));
        
        vm.stopBroadcast();
    }
}
