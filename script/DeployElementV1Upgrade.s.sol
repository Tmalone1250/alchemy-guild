// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/contracts/ElementNFT.sol";
import "../src/contracts/AlchemistContract.sol";
import "../src/contracts/GuildDistributor.sol";
import "../src/contracts/YieldVault.sol";

contract DeployElementV1Upgrade is Script {
    // Current addresses on Arbitrum Sepolia
    address constant YIELD_VAULT = 0x45959325A5606e20827e9Ef8bB0Ca253c584c0C4;
    address constant GUILD_DISTRIBUTOR = 0xDf90762ccF9a199Ca8872C18E4f9C5DE42f2773e;

    function run() external {
        uint256 botPrivateKey = vm.envOr("BOT_PRIVATE_KEY", uint256(0));
        if (botPrivateKey == 0) botPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        require(botPrivateKey != 0, "BOT_PRIVATE_KEY not set");
        address botWallet = vm.addr(botPrivateKey);

        console.log("=================================================");
        console.log("DEPLOYING ELEMENT NFT V1 UPGRADE (ARBITRUM SEPOLIA)");
        console.log("Deployer:", botWallet);
        console.log("=================================================");

        vm.startBroadcast(botPrivateKey);

        // 1. Deploy new ElementNFT V1 (IPFS & Randomizer)
        ElementNFT newElementNFT = new ElementNFT(botWallet);
        console.log("New ElementNFT Deployed at:", address(newElementNFT));

        // 2. Deploy new AlchemistContract pointing to new ElementNFT
        AlchemistContract newAlchemist = new AlchemistContract(address(newElementNFT), botWallet);
        console.log("New AlchemistContract Deployed at:", address(newAlchemist));

        // 3. Grant roles to new AlchemistContract on ElementNFT
        newElementNFT.grantRole(newElementNFT.MINTER_ROLE(), address(newAlchemist));
        newElementNFT.grantRole(newElementNFT.BURNER_ROLE(), address(newAlchemist));
        console.log("Granted MINTER_ROLE and BURNER_ROLE to AlchemistContract on ElementNFT");

        // 4. Link GuildDistributor on both new contracts
        newElementNFT.setGuildDistributor(GUILD_DISTRIBUTOR);
        newAlchemist.setGuildDistributor(GUILD_DISTRIBUTOR);
        console.log("Linked GuildDistributor on new ElementNFT and AlchemistContract");

        // 5. Update Existing Ecosystem Contracts to point to new ones
        GuildDistributor distributor = GuildDistributor(GUILD_DISTRIBUTOR);
        distributor.setContracts(address(newElementNFT), address(newAlchemist), YIELD_VAULT);
        console.log("Updated GuildDistributor to point to new ElementNFT & AlchemistContract");

        YieldVault vault = YieldVault(payable(YIELD_VAULT));
        vault.setElementNFT(address(newElementNFT));
        console.log("Updated YieldVault to point to new ElementNFT");

        vm.stopBroadcast();

        console.log("=================================================");
        console.log("UPGRADE COMPLETE");
        console.log("ElementNFT:", address(newElementNFT));
        console.log("AlchemistContract:", address(newAlchemist));
        console.log("=================================================");
    }
}
