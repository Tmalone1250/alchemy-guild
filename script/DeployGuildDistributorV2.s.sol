// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/contracts/GuildDistributorV2.sol";
import "../src/contracts/ElementNFT.sol";
import "../src/contracts/AlchemistContract.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DeployGuildDistributorV2 is Script {
    address constant CHAINLINK_ETH_USD = 0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165;
    address constant UNISWAP_POOL      = 0x66EEAB70aC52459Dd74C6AD50D578Ef76a441bbf;
    address constant GUILD_TOKEN       = 0x90d938A9f1e4a77d536d9f76Acc4B9520b1bc451;
    
    address constant ELEMENT_NFT       = 0x3A235044843e4EA0649FdD74A58151472E3Fef76;
    address constant ALCHEMIST         = 0x27F937Ff2cC5DC21BD8AEc83972C6470aE12A9fb;
    address constant SMART_ACCOUNT     = 0xc52a74cafC6d13618c20c5a355ea8cc09928C65c;

    function run() external {
        uint256 botPrivateKey = vm.envOr("BOT_PRIVATE_KEY", uint256(0));
        require(botPrivateKey != 0, "BOT_PRIVATE_KEY not set");
        address botWallet = vm.addr(botPrivateKey);

        console.log("=================================================");
        console.log("DEPLOYING GuildDistributorV2 & REFUNDING SUBSIDY");
        console.log("Owner / Bot Wallet:", botWallet);
        console.log("=================================================");

        vm.startBroadcast(botPrivateKey);

        // 1. Deploy GuildDistributorV2
        GuildDistributorV2 distributorV2 = new GuildDistributorV2(
            GUILD_TOKEN,
            CHAINLINK_ETH_USD,
            UNISWAP_POOL
        );
        console.log("GuildDistributorV2 Deployed:", address(distributorV2));

        // 2. Set Contracts on V2
        distributorV2.setContracts(ELEMENT_NFT, ALCHEMIST);
        console.log("Configured V2 Authorized Callers (NFT, Alchemist)");

        // 3. Fund V2 with 20M GUILD
        IERC20(GUILD_TOKEN).transfer(address(distributorV2), 20_000_000 * 10**18);
        console.log("Funded V2 with 20,000,000 GUILD");

        // 4. Update ElementNFT and AlchemistContract to point to V2
        ElementNFT(ELEMENT_NFT).setGuildDistributor(address(distributorV2));
        AlchemistContract(ALCHEMIST).setGuildDistributor(address(distributorV2));
        console.log("Linked ElementNFT and AlchemistContract to new V2");

        // 5. Refund missed subsidies (25.7142 GUILD) to User's Smart Account
        // 1 Tier 1 Mint ($1) + 1 Tier 2 Craft ($5) = $6 missed dynamic subsidy
        // Using ~4.2857 GUILD/USD = 25.7142 GUILD
        uint256 refundAmount = 25714200000000000000;
        IERC20(GUILD_TOKEN).transfer(SMART_ACCOUNT, refundAmount);
        console.log("Refunded 25.7142 GUILD to Smart Account:", SMART_ACCOUNT);

        vm.stopBroadcast();
        
        console.log("=================================================");
        console.log("SUCCESS");
        console.log("=================================================");
    }
}
