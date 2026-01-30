// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {AlchemyPaymaster} from "./src/contracts/AlchemyPaymaster.sol";

contract WhitelistTarget is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deployed Paymaster Address
        address paymasterAddress = 0x6BD9851Cde38391a1dB0118189d4AF02A3726487;
        AlchemyPaymaster paymaster = AlchemyPaymaster(payable(paymasterAddress));

        // Target Contracts from contracts.ts
        address elementNFT = 0x7106E305D55775C5ad7Bf818426B9d4fC4Ea0E6F;
        address yieldVault = 0xE60035bb9051583Ad9db78Ad1a8CC38f1e4834F8;
        address alchemist = 0x88fde738df4758f69240B0299C3Ff3d7963AC25A;

        // Whitelist them
        paymaster.setSponsoredContract(elementNFT, true);
        console.log("Whitelisted ElementNFT:", elementNFT);

        paymaster.setSponsoredContract(yieldVault, true);
        console.log("Whitelisted YieldVault:", yieldVault);

        paymaster.setSponsoredContract(alchemist, true);
        console.log("Whitelisted Alchemist:", alchemist);

        vm.stopBroadcast();
    }
}
