# **⚗️ Antigravity: Arbitrum Sepolia Migration & Bootstrap Script**

## **📌 Context**

To preserve the iExec Nox TEE precompile architecture for our Confidential Governance and Shielded Rebalancing, we are migrating the entire Alchemy Guild protocol from Base Sepolia to **Arbitrum Sepolia (Chain ID: 421614\)**.

The deployer wallet has been funded with \~29,000 USDC and native Arbitrum Sepolia ETH. We need to update all ecosystem configurations and create a standalone script to swap a portion of this USDC into WETH to prepare for our YieldVault liquidity seeding.

## **🛠️ Step 1: Ecosystem Configuration Updates**

### **1\. Frontend Config (src/config/wagmi.ts & src/config/contracts.ts)**

* Import arbitrumSepolia from @reown/appkit/networks (or viem/chains).  
* Set arbitrumSepolia as the primary network in the Wagmi config array.  
* Update any hardcoded block explorer URLs to https://sepolia.arbiscan.io/.

### **2\. Smart Contract Config (script/DeployAlchemyGuild.s.sol)**

Update the deployment script constants to use the canonical Arbitrum Sepolia addresses:

* UNISWAP\_V3\_FACTORY \= 0x248AB79Bbb9bC29bB72F7Cd42F17e054Fc40188e  
* UNISWAP\_V3\_POSITION\_MANAGER \= 0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2  
* SWAP\_ROUTER \= 0xE592427A0AEce92De3Edee1F18E0157C05861564  
* WETH \= 0x980B62Da83eFf3D4576C647993b0c1D7faf17c73  
* USDC \= 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d

## **💱 Step 2: Standalone USDC ➔ WETH Swap Script**

Create a new executable script at scripts/swap-usdc-weth-arb.ts.

**Requirements for the script:**

1. **Tech Stack:** Use viem and dotenv to load the deployer's private key.  
2. **Network Setup:** Connect to an Arbitrum Sepolia RPC (e.g., Alchemy/Infura or public fallback).  
3. **Approval Execution:**  
   * Call approve() on the USDC contract to allow the SWAP\_ROUTER to spend the specified USDC amount.  
   * Wait for the transaction receipt to ensure approval is confirmed before swapping.  
4. **Swap Execution (exactInputSingle):**  
   * Construct the parameters for the Uniswap V3 exactInputSingle function on the SWAP\_ROUTER.  
   * Use the 3000 (0.3%) fee tier pool for the USDC/WETH route.  
   * Set amountIn to the desired USDC amount (parsed to 6 decimals).  
   * Set amountOutMinimum to 0 (or a loosely calculated minimum for testnet tolerance).  
   * Execute the swap and log the transaction hash and the resulting WETH balance.

**Code Skeleton Guide for the Swap Parameters:**

const params \= {  
  tokenIn: USDC\_ADDRESS,  
  tokenOut: WETH\_ADDRESS,  
  fee: 3000,  
  recipient: deployerAccount.address,  
  deadline: BigInt(Math.floor(Date.now() / 1000\) \+ 60 \* 20), // 20 mins  
  amountIn: parseUnits("10000", 6), // Swapping 10,000 USDC  
  amountOutMinimum: 0n,  
  sqrtPriceLimitX96: 0n,  
};  
// Execute router.exactInputSingle(params)

## **🎯 Verification Checklist**

1. Ensure the swap script runs successfully via npx tsx scripts/swap-usdc-weth-arb.ts without reverting on the approve or exactInputSingle calls.  
2. Run forge build to ensure the smart contracts compile cleanly with the new Arbitrum Sepolia network constants.  
3. Run npm run build on the frontend to verify arbitrumSepolia is correctly integrated into Wagmi.