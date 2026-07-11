// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/contracts/YieldVault.sol";
import "../src/contracts/ElementNFT.sol";
import "../src/contracts/AlchemistContract.sol";
import "../src/contracts/AlchemyPaymaster.sol";

// Interfaces needed for simulation
interface IERC20 is IERC20Metadata {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

contract SimulateLiquidity is Script {
    // --- Base Mainnet Addresses ---
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant WETH = 0x4200000000000000000000000000000000000006;
    address constant SWAP_ROUTER = 0x2626664c2603336E57B271c5C0b26F421741e481;
    address constant POSITION_MANAGER = 0x03a520b32C04BF3bEEf7BEb72E919cf822EdC299;
    address constant UNISWAP_POOL = 0xd0b53D9277642d899DF5C87A3966A349A798F224; // USDC/WETH 0.05% (Selecting high volume pool) -> Or stick to 0.3%? 
    // Actually, let's use the one configured. If prod uses 0.3%, we use 0.3%
    // Base WETH/USDC 0.3% Pool: 0xB4D982054A66B124C236B1519C1cfdF5a4847DCA 
    address constant POOL_0_3 = 0xB4D982054A66B124C236B1519C1cfdF5a4847DCA;

    address constant ENTRY_POINT = 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789;
    
    // --- Whale for Swaps ---
    // A generic address we will fund using 'deal'
    address constant WHALE = 0x1234567890123456789012345678901234567890;

    function run() external {
        // 1. Setup Environment
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        address deployer;
        if (deployerPrivateKey != 0) {
            deployer = vm.addr(deployerPrivateKey);
            vm.startBroadcast(deployerPrivateKey);
        } else {
            deployer = msg.sender;
            vm.startBroadcast();
        }

        console.log("-----------------------------------------");
        console.log("BASE MAINNET SIMULATION STARTED");
        console.log("Deployer:", deployer);

        // 2. Deploy Contracts
        AlchemyPaymaster paymaster = new AlchemyPaymaster(
            IEntryPoint(ENTRY_POINT),
            deployer
        );
        console.log("Paymaster Deployed:", address(paymaster));

        // Fund Paymaster for Gas (Initial)
        // Note: checking balance in entrypoint
        paymaster.deposit{value: 0.1 ether}(); 

        YieldVault vault = new YieldVault(
            POSITION_MANAGER,
            SWAP_ROUTER,
            POOL_0_3,
            WETH,
            USDC,
            address(paymaster),
            ENTRY_POINT
        );
        console.log("YieldVault Deployed:", address(vault));

        ElementNFT nft = new ElementNFT(deployer); // Simplified for sim
        vault.setElementNFT(address(nft));
        
        // 3. Setup Vault Liquidity (Simulate Stakers)
        // We act as a user who sends funds to the vault (via mint logic usually, but here direct for sim)
        // Actually, simulating 'Receive' functionality
        
        // Give Vault some WETH and USDC to start Position
        deal(WETH, address(vault), 10 ether);
        deal(USDC, address(vault), 30000 * 1e6); // $30k

        // Trigger First Rebalance (Create Position)
        vault.rebalance();
        console.log("Initial Position Created");
        
        vm.stopBroadcast(); // Stop broadcast to Switch to Whale Prank

        // 4. THE WHALE (Generate Fees)
        vm.startPrank(WHALE);
        
        // Give Whale massive capital
        deal(USDC, WHALE, 10_000_000 * 1e6); // $10M USDC
        IERC20(USDC).approve(SWAP_ROUTER, type(uint256).max);

        console.log("\n--- WHALE ACTIVITY ---");
        // Swap 1: USDC -> WETH (Pump price up)
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: USDC,
            tokenOut: WETH,
            fee: 3000,
            recipient: WHALE,
            deadline: block.timestamp,
            amountIn: 5_000_000 * 1e6, // $5M Swap
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        uint256 wethOut = ISwapRouter(SWAP_ROUTER).exactInputSingle(params);
        console.log("Whale Swapped 5M USDC -> WETH:", wethOut);
        
        // Swap 2: WETH -> USDC (Dump price down)
        IERC20(WETH).approve(SWAP_ROUTER, type(uint256).max);
        params.tokenIn = WETH;
        params.tokenOut = USDC;
        params.amountIn = wethOut; // Sell all WETH back
        
        ISwapRouter(SWAP_ROUTER).exactInputSingle(params);
        console.log("Whale Swapped WETH -> USDC");
        
        vm.stopPrank();

        // 5. Time Travel
        vm.warp(block.timestamp + 1 hours);

        // 6. Verify Tax & Yield
        vm.startBroadcast(deployerPrivateKey);

        uint256 paymasterBalanceBefore = IEntryPoint(ENTRY_POINT).balanceOf(address(paymaster));
        console.log("\nPaymaster Balance (Before Harvest):", paymasterBalanceBefore);
        
        console.log("Harvesting Fees...");
        vault.rebalance();
        
        uint256 paymasterBalanceAfter = IEntryPoint(ENTRY_POINT).balanceOf(address(paymaster));
        console.log("Paymaster Balance (After Harvest): ", paymasterBalanceAfter);

        uint256 taxCollected = paymasterBalanceAfter - paymasterBalanceBefore;
        console.log("Tax Collected (Wei):", taxCollected);

        if (taxCollected > 0) {
            console.log(unicode"✅ SUCCESS: Tax was collected and deposited to EntryPoint!");
        } else {
            console.log(unicode"❌ FAILURE: No tax collected. Check fee generation or liquidity range.");
        }

        vm.stopBroadcast();
    }
}
