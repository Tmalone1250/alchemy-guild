// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/contracts/YieldVault.sol";
import "../src/contracts/AlchemyPaymaster.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../src/contracts/IUniswap.sol";

contract DeployYieldVaultHotfix is Script {
    address constant POSITION_MANAGER = 0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65;
    address constant SWAP_ROUTER      = 0x101F443B4d1b059569D643917553c771E1b9663E;
    address constant UNISWAP_POOL     = 0x66EEAB70aC52459Dd74C6AD50D578Ef76a441bbf;
    address constant WETH_ADDRESS     = 0x980B62Da83eFf3D4576C647993b0c1D7faf17c73;
    address constant USDC_ADDRESS     = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;
    address payable constant PAYMASTER = payable(0x1083E73C1149D5c96c3b75C1822089923ed7553E);
    address constant ENTRY_POINT      = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;

    address constant ELEMENT_NFT_ADDRESS       = 0x3A235044843e4EA0649FdD74A58151472E3Fef76;
    address constant GUILD_TOKEN_ADDRESS       = 0x90d938A9f1e4a77d536d9f76Acc4B9520b1bc451;
    address constant USDT_ADDRESS              = 0xD7635043c67Ce3E5aA3df322E047C07E56687de7;
    address constant GUILD_DISTRIBUTOR_ADDRESS = 0xe71283Fd6cE7BB30243bb1fba0eC839A56DD9d62;

    function run() external {
        uint256 botPrivateKey = vm.envOr("BOT_PRIVATE_KEY", uint256(0));
        require(botPrivateKey != 0, "BOT_PRIVATE_KEY not set");
        address botWallet = vm.addr(botPrivateKey);

        console.log("=================================================");
        console.log("DEPLOYING HOTFIX YIELD VAULT");
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
        console.log("New YieldVault Deployed:", address(vault));

        // 2. Set contracts
        vault.setElementNFT(ELEMENT_NFT_ADDRESS);
        vault.setEcosystemTokens(GUILD_TOKEN_ADDRESS, USDT_ADDRESS, GUILD_DISTRIBUTOR_ADDRESS);
        console.log("Cross-Contract Links Established on Vault");

        // 3. Whitelist on AlchemyPaymaster
        // Note: The paymaster address in DeployGuildEcosystemV07 used an old address variable, 
        // but contracts.ts says PAYMASTER is 0x1083E73C1149D5c96c3b75C1822089923ed7553E.
        AlchemyPaymaster(PAYMASTER).setSponsoredContract(address(vault), true);
        console.log("Whitelisted new Vault on AlchemyPaymaster");

        // 4. Wrap some ETH and Mint LP position
        // Wrapping 0.05 ETH to WETH
        if (botWallet.balance >= 0.06 ether) {
            IWETH(WETH_ADDRESS).deposit{value: 0.05 ether}();
            console.log("Wrapped 0.05 ETH to WETH");

            // Approve router
            IERC20(WETH_ADDRESS).approve(SWAP_ROUTER, type(uint256).max);

            // Swap 0.02 WETH for USDC
            ISwapRouter.ExactInputSingleParams memory swapParams = ISwapRouter.ExactInputSingleParams({
                tokenIn: WETH_ADDRESS,
                tokenOut: USDC_ADDRESS,
                fee: 3000,
                recipient: botWallet,
                amountIn: 0.02 ether,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });
            ISwapRouter(SWAP_ROUTER).exactInputSingle(swapParams);
            console.log("Swapped 0.02 WETH for USDC");

            // Mint LP Position
            uint256 wethBal = IERC20(WETH_ADDRESS).balanceOf(botWallet);
            uint256 usdcBal = IERC20(USDC_ADDRESS).balanceOf(botWallet);
            
            // Only use what we have, cap at 0.01 WETH / 30 USDC to be safe
            uint256 wethAmt = wethBal > 0.01 ether ? 0.01 ether : wethBal;
            uint256 usdcAmt = usdcBal > 30000000 ? 30000000 : usdcBal;

            IERC20(WETH_ADDRESS).approve(POSITION_MANAGER, type(uint256).max);
            IERC20(USDC_ADDRESS).approve(POSITION_MANAGER, type(uint256).max);

            address token0 = WETH_ADDRESS < USDC_ADDRESS ? WETH_ADDRESS : USDC_ADDRESS;
            address token1 = WETH_ADDRESS < USDC_ADDRESS ? USDC_ADDRESS : WETH_ADDRESS;
            uint256 amount0 = token0 == WETH_ADDRESS ? wethAmt : usdcAmt;
            uint256 amount1 = token1 == WETH_ADDRESS ? wethAmt : usdcAmt;

            INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
                token0: token0,
                token1: token1,
                fee: 3000,
                tickLower: -887220,
                tickUpper: 887220,
                amount0Desired: amount0,
                amount1Desired: amount1,
                amount0Min: 0,
                amount1Min: 0,
                recipient: botWallet,
                deadline: block.timestamp + 1000
            });

            (uint256 tokenId, , , ) = INonfungiblePositionManager(POSITION_MANAGER).mint(params);
            console.log("Minted LP Position:", tokenId);
            IERC721(POSITION_MANAGER).safeTransferFrom(botWallet, address(vault), tokenId);
            console.log("Transferred LP Position to YieldVault");
        } else {
            console.log("Not enough ETH to create new LP position. Found:", botWallet.balance);
        }

        vm.stopBroadcast();
        console.log("=================================================");
        console.log("HOTFIX COMPLETE");
        console.log("New YieldVault:", address(vault));
        console.log("=================================================");
    }
}

interface IERC721 {
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}
