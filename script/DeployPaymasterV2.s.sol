// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/contracts/AlchemyPaymaster.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

contract DeployPaymasterV2 is Script {
    address constant ENTRY_POINT = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;
    address constant ELEMENT_NFT = 0x3A235044843e4EA0649FdD74A58151472E3Fef76;
    address constant YIELD_VAULT = 0x7a535fFd02d6C00F9131F31e435Ce5cf321bF9E6; // Wait, from contracts.ts, it's 0x7a53...
    address constant ALCHEMIST = 0x27F937Ff2cC5DC21BD8AEc83972C6470aE12A9fb;
    address constant CGUILD = 0xA6efeeBD751796031968Fb1F5EBdB373BCDC3e45;
    address constant GUILD_TOKEN = 0x90d938A9f1e4a77d536d9f76Acc4B9520b1bc451;
    address constant GUILD_DISTRIBUTOR = 0xDf90762ccF9a199Ca8872C18E4f9C5DE42f2773e;
    address constant GUILD_DAO = 0x3c83c1C5C5607d91A562b70cC281b08dfdaB422d;

    function run() external {
        uint256 botPrivateKey = vm.envOr("BOT_PRIVATE_KEY", uint256(0));
        require(botPrivateKey != 0, "BOT_PRIVATE_KEY not set");
        address botWallet = vm.addr(botPrivateKey);

        console.log("Owner / Bot Wallet:", botWallet);

        vm.startBroadcast(botPrivateKey);

        // 1. Deploy new Paymaster
        AlchemyPaymaster paymaster = new AlchemyPaymaster(IEntryPoint(ENTRY_POINT), botWallet);
        console.log("New AlchemyPaymaster Deployed:", address(paymaster));

        // 2. Deposit 0.3 ETH
        paymaster.deposit{value: 308590830565381152}();
        console.log("Deposited 0.3 ETH to Paymaster");

        // 3. Whitelist Contracts
        paymaster.setSponsoredContract(ELEMENT_NFT, true);
        paymaster.setSponsoredContract(YIELD_VAULT, true);
        paymaster.setSponsoredContract(ALCHEMIST, true);
        paymaster.setSponsoredContract(CGUILD, true);
        paymaster.setSponsoredContract(GUILD_TOKEN, true);
        paymaster.setSponsoredContract(GUILD_DISTRIBUTOR, true);
        paymaster.setSponsoredContract(GUILD_DAO, true);
        console.log("Whitelisted all ecosystem contracts on Paymaster");

        vm.stopBroadcast();
    }
}
