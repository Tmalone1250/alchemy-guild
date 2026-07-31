// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/contracts/YieldVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../src/contracts/IUniswap.sol";

contract GenerateYield is Script {
    address constant SWAP_ROUTER = 0x101F443B4d1b059569D643917553c771E1b9663E;
    address constant WETH_ADDRESS = 0x980B62Da83eFf3D4576C647993b0c1D7faf17c73;
    address constant USDC_ADDRESS = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;
    address constant VAULT_ADDRESS = 0xF468Ec2442E6b5206eA39AfAbC57A58773D3f8A3;

    function run() external {
        uint256 botPrivateKey = vm.envOr("BOT_PRIVATE_KEY", uint256(0));
        address botWallet = vm.addr(botPrivateKey);
        
        vm.startBroadcast(botPrivateKey);

        IERC20(WETH_ADDRESS).approve(SWAP_ROUTER, type(uint256).max);

        // Swap 0.01 WETH to USDC on the WETH/USDC 0.3% pool to generate fees
        ISwapRouter(SWAP_ROUTER).exactInputSingle(ISwapRouter.ExactInputSingleParams({
            tokenIn: WETH_ADDRESS,
            tokenOut: USDC_ADDRESS,
            fee: 3000,
            recipient: botWallet,
            amountIn: 0.01 ether,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        }));
        
        // Harvest
        YieldVault(payable(VAULT_ADDRESS)).harvestAndDistribute();

        vm.stopBroadcast();
    }
}
