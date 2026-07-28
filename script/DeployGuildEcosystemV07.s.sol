// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/contracts/GuildToken.sol";
import "../src/contracts/GuildDistributor.sol";
import "../src/contracts/ElementNFT.sol";
import "../src/contracts/YieldVault.sol";
import "../src/contracts/AlchemistContract.sol";
import "../src/contracts/AlchemyPaymaster.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract DeployGuildEcosystemV07 is Script {
    address constant POSITION_MANAGER = 0xC36442b4a4522E871399CD717aBDD847Ab11FE88;
    address constant SWAP_ROUTER      = 0x101F443B4d1b059569D643917553c771E1b9663E;
    address constant UNISWAP_POOL     = 0x66EEAB70aC52459Dd74C6AD50D578Ef76a441bbf;
    address constant WETH_ADDRESS     = 0x980B62Da83eFf3D4576C647993b0c1D7faf17c73;
    address constant USDC_ADDRESS     = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;
    address payable constant PAYMASTER = payable(0xa9924829148A1a1Bd057EAC11B448084cDCbC60a);
    address constant ENTRY_POINT      = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;

    function run() external {
        uint256 botPrivateKey = vm.envOr("BOT_PRIVATE_KEY", uint256(0));
        require(botPrivateKey != 0, "BOT_PRIVATE_KEY not set");
        address botWallet = vm.addr(botPrivateKey);

        console.log("=================================================");
        console.log("DEPLOYING GUILD ECOSYSTEM ON ARBITRUM SEPOLIA");
        console.log("Owner / Bot Wallet:", botWallet);
        console.log("=================================================");

        vm.startBroadcast(botPrivateKey);

        // 1. Deploy new YieldVault
        YieldVault vault = new YieldVault(
            POSITION_MANAGER,
            SWAP_ROUTER,
            UNISWAP_POOL,
            WETH_ADDRESS,
            USDC_ADDRESS,
            PAYMASTER,
            ENTRY_POINT
        );
        console.log("YieldVault Deployed:", address(vault));

        // 2. Deploy GuildToken (allocates 20M to YieldVault, 80M to owner)
        GuildToken guild = new GuildToken(address(vault), botWallet);
        console.log("GuildToken Deployed:", address(guild));

        // 3. Deploy GuildDistributor
        GuildDistributor distributor = new GuildDistributor(address(guild));
        distributor.setUsdc(USDC_ADDRESS);
        console.log("GuildDistributor Deployed:", address(distributor));

        // 4. Deploy ElementNFT (with GUILD rewards on mint)
        ElementNFT nft = new ElementNFT(botWallet);
        console.log("ElementNFT Deployed:", address(nft));

        // 5. Deploy AlchemistContract (with GUILD rewards on craft)
        AlchemistContract alchemist = new AlchemistContract(address(nft), botWallet);
        console.log("AlchemistContract Deployed:", address(alchemist));

        // 6. Link contracts
        nft.setGuildDistributor(address(distributor));
        alchemist.setGuildDistributor(address(distributor));
        distributor.setContracts(address(nft), address(alchemist));
        vault.setElementNFT(address(nft));
        console.log("All Cross-Contract Links Established");

        // 7. Fund GuildDistributor with 20M GUILD
        guild.transfer(address(distributor), 20_000_000 * 10**18);
        console.log("Funded GuildDistributor with 20M GUILD");

        // Initialize GUILD/WETH Uniswap V3 Pool
        address token0 = WETH_ADDRESS < address(guild) ? WETH_ADDRESS : address(guild);
        address token1 = WETH_ADDRESS < address(guild) ? address(guild) : WETH_ADDRESS;
        
        INonfungiblePositionManager(POSITION_MANAGER).createAndInitializePoolIfNecessary(
            token0,
            token1,
            10000,
            79228162514264337593543950336 // 1:1 price
        );
        console.log("Initialized GUILD/WETH 1% Fee Pool");

        // 8. Re-seed new YieldVault with WETH and USDC via executeRebalanceDirect
        uint256 wethBal = IERC20(WETH_ADDRESS).balanceOf(botWallet);
        uint256 usdcBal = IERC20(USDC_ADDRESS).balanceOf(botWallet);
        console.log("Bot WETH Balance:", wethBal);
        console.log("Bot USDC Balance:", usdcBal);

        if (wethBal >= 499000000000000000 && usdcBal >= 2000000000) {
            IERC20(WETH_ADDRESS).transfer(address(vault), 499000000000000000);
            IERC20(USDC_ADDRESS).transfer(address(vault), 2000000000);
            vault.executeRebalanceDirect(-200000, 200000);
            console.log("Re-seeded new YieldVault LP position with 0.499 WETH and 2000 USDC");
        } else {
            console.log("Skipping deposit (check wallet WETH/USDC balances)");
        }

        // 9. Whitelist on AlchemyPaymaster
        AlchemyPaymaster(PAYMASTER).setSponsoredContract(address(nft), true);
        AlchemyPaymaster(PAYMASTER).setSponsoredContract(address(vault), true);
        AlchemyPaymaster(PAYMASTER).setSponsoredContract(address(alchemist), true);
        console.log("Whitelisted NFT, Vault, and Alchemist on AlchemyPaymaster");

        vm.stopBroadcast();

        console.log("=================================================");
        console.log("NEW ECOSYSTEM DEPLOYED SUCCESSFULLY:");
        console.log("YieldVault:", address(vault));
        console.log("ElementNFT:", address(nft));
        console.log("AlchemistContract:", address(alchemist));
        console.log("GuildToken:", address(guild));
        console.log("GuildDistributor:", address(distributor));
        console.log("=================================================");
    }
}
