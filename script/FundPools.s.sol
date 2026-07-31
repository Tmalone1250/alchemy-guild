// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/contracts/YieldVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../src/contracts/IUniswap.sol";
import "../src/contracts/MockUSDT.sol";

contract FundPools is Script {
    address constant SWAP_ROUTER      = 0x101F443B4d1b059569D643917553c771E1b9663E;
    address constant POSITION_MANAGER = 0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65;
    
    address constant WETH_ADDRESS     = 0x980B62Da83eFf3D4576C647993b0c1D7faf17c73;
    address constant USDC_ADDRESS     = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;
    address constant USDT_ADDRESS     = 0xD7635043c67Ce3E5aA3df322E047C07E56687de7;
    address constant GUILD_ADDRESS    = 0x90d938A9f1e4a77d536d9f76Acc4B9520b1bc451;
    
    address payable constant VAULT_ADDRESS = payable(0xF468Ec2442E6b5206eA39AfAbC57A58773D3f8A3);
    
    address constant UNISWAP_V3_FACTORY = 0x1F98431c8aD98523631AE4a59f267346ea31F984; // Factory address for Arbitrum Sepolia if needed?
    // Note: createAndInitializePoolIfNecessary handles the factory internally on POSITION_MANAGER.

    function _sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        return tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }
    
    function _snapToSpacing(int24 tick, int24 tickSpacing) internal pure returns (int24) {
        int24 remainder = tick % tickSpacing;
        if (remainder < 0) {
            remainder += tickSpacing;
        }
        int24 snapped = tick - remainder;
        // round to nearest
        if (remainder >= tickSpacing / 2) {
            snapped += tickSpacing;
        }
        return snapped;
    }

    function run() external {
        uint256 botPrivateKey = vm.envOr("BOT_PRIVATE_KEY", uint256(0));
        require(botPrivateKey != 0, "BOT_PRIVATE_KEY not set");
        address botWallet = vm.addr(botPrivateKey);
        
        vm.startBroadcast(botPrivateKey);

        // 1. Vault Transfer (2,000 USDC)
        IERC20(USDC_ADDRESS).transfer(VAULT_ADDRESS, 2000 * 1e6);
        console.log("Transferred 2,000 USDC to Vault.");
        
        // Approvals for Router & Position Manager
        IERC20(USDC_ADDRESS).approve(SWAP_ROUTER, type(uint256).max);
        IERC20(WETH_ADDRESS).approve(POSITION_MANAGER, type(uint256).max);
        IERC20(USDC_ADDRESS).approve(POSITION_MANAGER, type(uint256).max);
        IERC20(USDT_ADDRESS).approve(POSITION_MANAGER, type(uint256).max);
        IERC20(GUILD_ADDRESS).approve(POSITION_MANAGER, type(uint256).max);

        // --- 2. High Risk GUILD Pool (GUILD/WETH - 1%) ---
        console.log("Setting up GUILD/WETH 1% Pool...");
        uint256 wethForGuild = ISwapRouter(SWAP_ROUTER).exactInputSingle(ISwapRouter.ExactInputSingleParams({
            tokenIn: USDC_ADDRESS, tokenOut: WETH_ADDRESS, fee: 3000, recipient: botWallet,
            amountIn: 800 * 1e6, amountOutMinimum: 0, sqrtPriceLimitX96: 0
        }));
        // GUILD pool is initialized at 1:1, so we provide an equivalent amount of GUILD
        uint256 guildToProvide = wethForGuild; 
        
        (address token0Guild, address token1Guild) = _sortTokens(GUILD_ADDRESS, WETH_ADDRESS);
        address poolGuild = INonfungiblePositionManager(POSITION_MANAGER).createAndInitializePoolIfNecessary(
            token0Guild, token1Guild, 10000, 79228162514264337593543950336
        );
        (, int24 activeTickGuild, , , , , ) = IUniswapV3Pool(poolGuild).slot0();
        int24 snappedGuild = _snapToSpacing(activeTickGuild, 200);
        
        INonfungiblePositionManager(POSITION_MANAGER).mint(INonfungiblePositionManager.MintParams({
            token0: token0Guild, token1: token1Guild, fee: 10000,
            tickLower: snappedGuild - 2400, tickUpper: snappedGuild + 2400, // +/- 25%
            amount0Desired: token0Guild == GUILD_ADDRESS ? guildToProvide : wethForGuild,
            amount1Desired: token1Guild == GUILD_ADDRESS ? guildToProvide : wethForGuild,
            amount0Min: 0, amount1Min: 0, recipient: VAULT_ADDRESS, deadline: block.timestamp + 1 hours
        }));
        console.log("Minted GUILD/WETH LP to Vault.");

        // --- 3. Blue Chip Pool (WETH/USDC - 0.3%) ---
        console.log("Setting up WETH/USDC 0.3% Pool...");
        uint256 wethForBlueChip = ISwapRouter(SWAP_ROUTER).exactInputSingle(ISwapRouter.ExactInputSingleParams({
            tokenIn: USDC_ADDRESS, tokenOut: WETH_ADDRESS, fee: 3000, recipient: botWallet,
            amountIn: 1200 * 1e6, amountOutMinimum: 0, sqrtPriceLimitX96: 0
        }));
        
        (address token0Blue, address token1Blue) = _sortTokens(WETH_ADDRESS, USDC_ADDRESS);
        address poolBlue = INonfungiblePositionManager(POSITION_MANAGER).createAndInitializePoolIfNecessary(
            token0Blue, token1Blue, 3000, 
            token0Blue == WETH_ADDRESS ? 250541448375047931186413801569 : 25054144837504793118641380156 // Just call pool, don't re-initialize price if exists
        );
        (, int24 activeTickBlue, , , , , ) = IUniswapV3Pool(poolBlue).slot0();
        int24 snappedBlue = _snapToSpacing(activeTickBlue, 60);

        INonfungiblePositionManager(POSITION_MANAGER).mint(INonfungiblePositionManager.MintParams({
            token0: token0Blue, token1: token1Blue, fee: 3000,
            tickLower: snappedBlue - 960, tickUpper: snappedBlue + 960, // +/- 10%
            amount0Desired: token0Blue == WETH_ADDRESS ? wethForBlueChip : 1200 * 1e6,
            amount1Desired: token1Blue == WETH_ADDRESS ? wethForBlueChip : 1200 * 1e6,
            amount0Min: 0, amount1Min: 0, recipient: VAULT_ADDRESS, deadline: block.timestamp + 1 hours
        }));
        console.log("Minted WETH/USDC LP to Vault.");

        // --- 4. Stable Coin Pool (USDT/USDC - 0.05%) ---
        console.log("Setting up USDT/USDC 0.05% Pool...");
        MockUSDT(USDT_ADDRESS).mint(botWallet, 2000 * 1e6); // Mint 2000 USDT
        
        (address token0Stable, address token1Stable) = _sortTokens(USDT_ADDRESS, USDC_ADDRESS);
        address poolStable = INonfungiblePositionManager(POSITION_MANAGER).createAndInitializePoolIfNecessary(
            token0Stable, token1Stable, 500, 79228162514264337593543950336 // 1:1 price
        );
        (, int24 activeTickStable, , , , , ) = IUniswapV3Pool(poolStable).slot0();
        int24 snappedStable = _snapToSpacing(activeTickStable, 10);

        INonfungiblePositionManager(POSITION_MANAGER).mint(INonfungiblePositionManager.MintParams({
            token0: token0Stable, token1: token1Stable, fee: 500,
            tickLower: snappedStable - 50, tickUpper: snappedStable + 50, // +/- 0.5%
            amount0Desired: 2000 * 1e6,
            amount1Desired: 2000 * 1e6,
            amount0Min: 0, amount1Min: 0, recipient: VAULT_ADDRESS, deadline: block.timestamp + 1 hours
        }));
        console.log("Minted USDT/USDC LP to Vault.");

        vm.stopBroadcast();
        console.log("Successfully funded all pools with volatility-adjusted liquidity!");
    }
}
