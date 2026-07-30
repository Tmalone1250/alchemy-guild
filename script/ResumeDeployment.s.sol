// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/contracts/ElementNFT.sol";
import "../src/contracts/AlchemistContract.sol";
import "../src/contracts/GuildDistributor.sol";
import "../src/contracts/YieldVault.sol";

contract ResumeDeployment is Script {
    address constant YIELD_VAULT = 0x45959325A5606e20827e9Ef8bB0Ca253c584c0C4;
    address constant GUILD_DISTRIBUTOR = 0xDf90762ccF9a199Ca8872C18E4f9C5DE42f2773e;
    address constant ELEMENT_NFT = 0x3A235044843e4EA0649FdD74A58151472E3Fef76;
    address constant ALCHEMIST = 0x27F937Ff2cC5DC21BD8AEc83972C6470aE12A9fb;

    function run() external {
        uint256 botPrivateKey = vm.envOr("BOT_PRIVATE_KEY", uint256(0));
        if (botPrivateKey == 0) botPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        require(botPrivateKey != 0, "BOT_PRIVATE_KEY not set");

        vm.startBroadcast(botPrivateKey);

        ElementNFT newElementNFT = ElementNFT(ELEMENT_NFT);
        AlchemistContract newAlchemist = AlchemistContract(ALCHEMIST);

        // Resume from BURNER_ROLE grant
        newElementNFT.grantRole(newElementNFT.BURNER_ROLE(), address(newAlchemist));
        console.log("Granted BURNER_ROLE to AlchemistContract on ElementNFT");

        newElementNFT.setGuildDistributor(GUILD_DISTRIBUTOR);
        newAlchemist.setGuildDistributor(GUILD_DISTRIBUTOR);
        console.log("Linked GuildDistributor on new ElementNFT and AlchemistContract");

        GuildDistributor distributor = GuildDistributor(GUILD_DISTRIBUTOR);
        distributor.setContracts(address(newElementNFT), address(newAlchemist), YIELD_VAULT);
        console.log("Updated GuildDistributor to point to new ElementNFT & AlchemistContract");

        YieldVault vault = YieldVault(payable(YIELD_VAULT));
        vault.setElementNFT(address(newElementNFT));
        console.log("Updated YieldVault to point to new ElementNFT");

        vm.stopBroadcast();
    }
}
