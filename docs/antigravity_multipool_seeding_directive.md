# ⚗️ Antigravity Directive: Multi-Pool Seeding & Omnichannel Bot Retargeting

**Target Network:** Arbitrum Sepolia (421614)
**Context:** The bot wallet currently holds ~3.6 ETH, ~15,000 USDC, and ~0.36 WETH. We need to optimize this capital to kickstart the beta test, seed the three physical Uniswap V3 pools, keep a reserve, and load the 3-3-1 Waterfall with early yield.

---

## 💰 Task 1: The Asset Allocation Strategy
Before seeding the pools, the script `scripts/seed-testnet-pools.ts` must allocate the existing bot wallet funds exactly as follows:

1. **The Waterfall Seed (10,000 USDC):** * Approve and call `notifyRewardAmount(10000 * 10**USDC_DECIMALS)` on the `GuildDistributor` contract. This immediately loads the triple-accumulator with a massive reward pool so early beta testers see skyrocketing APYs as soon as they stake.
2. **The Protocol Reserve (1,000 USDC):**
   * Keep 1,000 USDC in the bot wallet untouched for future gas paymaster refills or emergency liquidity.
3. **The Pool Capital (4,000 USDC + ETH/WETH):**
   * The remaining 4,000 USDC, along with the ETH/WETH, will be split to seed the three DEX pools.

---

## 🛠️ Task 2: The Multi-Pool Seeding Script
In `scripts/seed-testnet-pools.ts`, execute the following actions using the Uniswap V3 Router and NonfungiblePositionManager (NFPM: `0xC36442b4a4522E871399CD717aBDD847Ab11FE88`).

**Step 1: Acquire USDT for the Stable Pool**
* The bot wallet currently has no USDT. Use the Uniswap V3 Router to swap `1,000 USDC` into `USDT`.

**Step 2: Mint the 3 Liquidity Positions (Full Tick Range)**
1. **The Safe Vault (USDC/USDT - 0.01% or 0.05% Fee Tier):** * Seed with the newly swapped `~1,000 USDT` and `1,000 USDC`. 
2. **The Medium Vault (WETH/USDC - 0.3% Fee Tier):** * Seed with `2,000 USDC` and the equivalent `WETH`. (Wrap some of the 3.6 ETH into WETH if the 0.36 WETH balance is not enough to match the 2,000 USDC ratio).
3. **The Degen Vault (GUILD/WETH - 1% Fee Tier):** * Wrap an additional `1.0 ETH` into `WETH`. Seed this pool with `50,000 GUILD` and `1.0 WETH` (assuming a 1:1 relative initialization price). 

*Note: Ensure `YieldVault` takes ownership of the resulting ERC-721 position NFTs so it can securely manage the harvesting of fees.*

---

## 🤖 Task 3: Upgrading to the Omnichannel Volume Bot
Update `volume-bot.ts` into a multi-route loop that generates fees across the entire ecosystem using the remaining wallet reserves (~2.6 ETH and 1,000 USDC).

### 1. The Multi-Route Ping-Pong Loop
Refactor the bot to loop through this exact sequence every few minutes:
* **Route 1 (Stables):** Swap `10 USDC` to `USDT`, then swap exact `USDT` back to `USDC`.
* **Route 2 (Blue-Chips):** Swap `0.01 WETH` for `USDC`, then swap exact `USDC` back to `WETH`.
* **Route 3 (Degen):** Swap `0.01 WETH` for `GUILD`, then swap exact `GUILD` back to `WETH`.

**The Result:** By swapping back and forth across all three pairs, the bot pays the pool fees on both sides. This rapidly fills all three physical testnet pools with fee revenue without exposing the bot to heavy market risk.

### 2. The Harvest Trigger
Every 10th loop, have the bot call `YieldVault.harvestAndDistribute()` to pull the accrued fees from all active positions, swap necessary pairs to USDC via the router, and push them into the `GuildDistributor` Waterfall.

---

## 🏁 Verification Steps
1. Run `npx tsx scripts/seed-testnet-pools.ts`. Verify the NFPM mints all three ERC-721 liquidity positions successfully on Arbiscan and the Distributor receives the 10k USDC payload.
2. Run `npx tsx volume-bot.ts`. Monitor the terminal to ensure it executes swaps across all three pool routes.
3. Open the frontend to the Vault page. The 10k USDC seed should immediately reflect in the APYs, and the bot's volume should continuously tick the "Total Pending Yield" upward.
