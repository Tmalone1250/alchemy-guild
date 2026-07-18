// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/contracts/AlchemyPaymaster.sol";

contract DeployAndFundPaymasterV07 is Script {
    // Canonical EntryPoint v0.7 on Arbitrum Sepolia
    address constant ENTRY_POINT_V07 = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;
    
    // Deployed verified contracts on Arbitrum Sepolia
    address constant YIELD_VAULT = 0xADDdF24a211e30e9aa469D5098E8176273FEd5bD;
    address constant ELEMENT_NFT = 0x3391e77c91328CaD4687BB6e64443f1a57f0eF25;

    function run() external {
        uint256 botPrivateKey = vm.envOr("BOT_PRIVATE_KEY", uint256(0));
        require(botPrivateKey != 0, "BOT_PRIVATE_KEY not set");
        address botWallet = vm.addr(botPrivateKey);

        console.log("=================================================");
        console.log("DEPLOYING & FUNDING ALCHEMY PAYMASTER (ENTRYPOINT V0.7)");
        console.log("Deployer / Owner:", botWallet);
        console.log("EntryPoint v0.7:", ENTRY_POINT_V07);
        console.log("=================================================");

        vm.startBroadcast(botPrivateKey);

        // 1. Deploy new AlchemyPaymaster pointing to EntryPoint v0.7
        AlchemyPaymaster paymaster = new AlchemyPaymaster(
            IEntryPoint(ENTRY_POINT_V07),
            botWallet
        );
        console.log("New AlchemyPaymaster Deployed:", address(paymaster));

        // 2. Whitelist ElementNFT and YieldVault
        paymaster.setSponsoredContract(ELEMENT_NFT, true);
        console.log("Whitelisted ElementNFT:", ELEMENT_NFT);

        paymaster.setSponsoredContract(YIELD_VAULT, true);
        console.log("Whitelisted YieldVault:", YIELD_VAULT);

        // 3. Deposit 0.3 ETH directly into EntryPoint v0.7 for this paymaster
        paymaster.deposit{value: 0.3 ether}();
        console.log("Deposited 0.3 ETH into EntryPoint v0.7 for Paymaster");
        console.log("Current Deposit:", paymaster.getDeposit());

        vm.stopBroadcast();

        console.log("=================================================");
        console.log("PAYMASTER READY & FUNDED ON ARBITRUM SEPOLIA");
        console.log("=================================================");
    }
}
