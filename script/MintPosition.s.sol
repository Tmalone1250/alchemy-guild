// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../src/contracts/IUniswap.sol";

contract MintPosition is Script {
    address constant POSITION_MANAGER = 0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65;
    address constant WETH = 0x980B62Da83eFf3D4576C647993b0c1D7faf17c73;
    address constant USDC = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;
    address constant VAULT = 0x7a535fFd02d6C00F9131F31e435Ce5cf321bF9E6;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        uint256 wethAmt = 1000000000000000; // 0.001 WETH
        uint256 usdcAmt = 3000000; // 3 USDC

        IERC20(WETH).approve(POSITION_MANAGER, type(uint256).max);
        IERC20(USDC).approve(POSITION_MANAGER, type(uint256).max);

        // Sort tokens
        address token0 = WETH < USDC ? WETH : USDC;
        address token1 = WETH < USDC ? USDC : WETH;
        
        uint256 amount0 = token0 == WETH ? wethAmt : usdcAmt;
        uint256 amount1 = token1 == WETH ? wethAmt : usdcAmt;

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
            recipient: vm.addr(deployerKey), // send NFT to deployer first
            deadline: block.timestamp + 1000
        });

        (uint256 tokenId, , , ) = INonfungiblePositionManager(POSITION_MANAGER).mint(params);
        IERC721(POSITION_MANAGER).safeTransferFrom(vm.addr(deployerKey), VAULT, tokenId);
        
        vm.stopBroadcast();
    }
}

interface IERC721 {
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}
