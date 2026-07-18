# Alchemy Guild: Complete Project Overview

## 🏆 WTF!! Hackathon Summer Edition Submission & iExec Nox Integration

This repository contains the full codebase for **Alchemy Guild**, submitted to the **WTF!! Hackathon Summer Edition**. It features a production-ready integration with the **iExec Nox Protocol** for encrypted on-chain state:
* **Confidential Target Ticks**: Nox handles tick encryption within the automated Volume Bot's `rebalance()` ritual, protecting liquidity range adjustments from potential front-running or sandwich attacks.
* **Confidential Council (DAO)**: A 3-layer confidential TEE voting structure powered by the `cGUILD` wrapper. The iExec Nox TEE allows for fully encrypted, sealed-ballot voting and secure AI Agent Master Key delegation to autonomous agents.

---

## Executive Summary

**Alchemy Guild** is a production-ready gamified DeFi protocol that transforms traditional NFT staking into an immersive elemental alchemy experience. Users collect, craft, and stake elemental NFTs to earn **GOLD** (USDC) generated from real **Uniswap V3 liquidity provision**. The project combines gaming mechanics with sophisticated DeFi infrastructure, featuring **fully gasless transactions** powered by ERC-4337 Account Abstraction, confidential state powered by **iExec Nox Protocol**, and a **self-sustaining economic model** where protocol fees automatically fund gas sponsorship.

**Core Innovation**: A closed-loop sustainable economy where:
- User fees (minting/crafting) $\rightarrow$ Vault liquidity
- Trading fees $\rightarrow$ Staker yields (90%) + Gas sponsorship (10%)
- Gas sponsorship $\rightarrow$ Enables gasless user experience
- Gasless experience $\rightarrow$ Drives user adoption $\rightarrow$ More fees

**Current Status**:
- ✅ **Production-Ready on Arbitrum Sepolia (Chain ID: 421614)** (Fully migrated to support Nox TEE precompile architecture)

---

## Part 1: The Gamified Experience

### The Elemental Hierarchy

Players interact with 18 unique elemental NFTs organized into three tiers, each representing increasing power and yield potential.

#### Tier 1: Basic Elements (Lead Tier)

**Weight Multiplier: 100**

The six fundamental forces of nature:
- 🪨 **Earth** - Stability and foundation
- 💧 **Water** - Flow and adaptability
- 💨 **Wind** - Freedom and movement
- 🔥 **Fire** - Passion and transformation
- ❄️ **Ice** - Preservation and control
- ⚡ **Lightning** - Speed and power

**Gameplay**: Entry-level NFTs that any player can mint for 0.002 ETH. These serve as the building blocks for progression.

#### Tier 2: Combined Elements (Silver Tier)

**Weight Multiplier: 135** (+35% vs Tier 1)

Advanced elements created through alchemical transmutation:
- 🌊 **Tsunami** - Water fusion
- 🌪️ **Tornado** - Wind fusion
- 🔥 **Inferno** - Fire fusion
- 🧊 **Blizzard** - Ice fusion
- 🌋 **Quake** - Earth fusion
- ⚡ **Plasma** - Lightning fusion

**Gameplay**: Requires burning 3 Tier 1 NFTs + 0.002 ETH fee (injected into Vault liquidity).

#### Tier 3: Mystical Elements (Gold Tier)

**Weight Multiplier: 175** (+75% vs Tier 1, +30% vs Tier 2)

The rarest and most powerful elements:
- ✨ **Holy** - Pure light energy
- 🌑 **Dark** - Shadow essence
- 🌀 **Gravity** - Spacetime manipulation
- ⏰ **Time** - Temporal control
- 🧬 **Bio** - Life force
- 👻 **Spirit** - Ethereal power

**Gameplay**: Requires burning 3 Tier 2 NFTs + 0.002 ETH. Represents the pinnacle of alchemical mastery, offering maximum yield.

### The Crafting Lab (Transmutation)

**The Alchemical Process:**

Unlike simple upgrades, Alchemy Guild uses a **recipe-based transmutation system** that requires strategic element combinations.

**Core Rules:**
1. **3 NFTs Required**: Always burn exactly 3 NFTs per transmutation
2. **Tier Consistency**: All 3 NFTs must be the same tier
3. **Liquidity Injection**: 0.002 ETH fee per craft is sent to Yield Vault
4. **Permanent Burn**: All 3 input NFTs are destroyed forever
5. **Random Output**: Receive 1 NFT of next tier with random element

**Example Player Journey:**
```
Start: Mint 9x Tier 1 NFTs (0.018 ETH)
  → 2x Earth, 2x Water, 2x Wind, 1x Fire, 1x Ice, 1x Lightning

Craft #1: Burn Earth + Earth + Fire → 1x Quake (Tier 2)
  Cost: 0.002 ETH
  Remaining: 2x Water, 2x Wind, 1x Ice, 1x Lightning, 1x Quake

Craft #2: Burn Water + Water + Wind → 1x Tsunami (Tier 2)
  Cost: 0.002 ETH
  Remaining: 1x Wind, 1x Ice, 1x Lightning, 1x Quake, 1x Tsunami

Craft #3: Burn Quake + Tsunami + Plasma → 1x Time (Tier 3)
  Cost: 0.002 ETH
  Final: 1x Wind, 1x Ice, 1x Lightning, 1x Time

Total Investment: 0.024 ETH (0.018 minting + 0.006 crafting)
Final Collection: 4 NFTs (from 9)
Highest Tier: 1x Tier 3 (175 weight) for maximum yield
```

### The Vault (Staking Experience)

**The Ritual:**
1. **Selection**: Player chooses an elemental NFT from their inventory
2. **Commitment**: Transfer NFT to the Vault contract (gasless via Smart Account)
3. **Activation**: NFT begins accumulating **GOLD** rewards based on its weight
4. **Harvesting**: Claim accumulated rewards at any time (gasless)
5. **Unbinding**: Unstake to retrieve the NFT (automatically claims rewards, gasless)

**Yield Dynamics:**

Your pro-rata reward `$R_{user}$` is proportional to your staked weight `$W_{user}$` over global total weight `$W_{global}$` multiplied by total fees distributed `$F_{fees}$`:

$$R_{user} = \frac{W_{user}}{W_{global}} \times F_{fees}$$

**Example Scenario:**
- You stake: 1x Tier 3 (Holy) = 175 weight ($W_{user} = 175$)
- Others stake: Total 825 weight
- Global weight: 1,000 total ($W_{global} = 1000$)
- Vault distributes: 100 USDC in fees ($F_{fees} = 100$)
- Your reward: 
  $$R_{user} = \frac{175}{1000} \times 100 = 17.5 \text{ USDC (17.5\% of pool)}$$

### Dynamic Subsidy (Mint/Transmute-to-Earn)
Paying minting and crafting protocol fees triggers an instant **GUILD token subsidy** distributed directly from the Treasury Distributor:
- **Minting (Tier I):** Claims a subsidy of **`+10` GUILD** tokens.
- **Crafting Tier II:** Claims a subsidy of **`+50` GUILD** tokens.
- **Crafting Tier III:** Claims a subsidy of **`+250` GUILD** tokens.

Mathematically, the dynamic subsidy follows the function:

$$\text{Subsidy} = \begin{cases} 10 \text{ GUILD} & \text{for Minting (Tier I Element)} \\ 50 \text{ GUILD} & \text{for Transmuting Tier II Element} \\ 250 \text{ GUILD} & \text{for Transmuting Tier III Element} \end{cases}$$

---

## Part 2: Under The Hood - Technical Architecture

### The Self-Sustaining Economic Model

**The Innovation**: Alchemy Guild achieves **true gas sponsorship sustainability** through integrated on-chain tax recycling.

**The Flywheel:**
```
1. User mints/crafts NFT (pays 0.002 ETH fee)
      ↓
2. Fee converted to WETH and deposited into Vault
      ↓
3. Vault provides liquidity on Uniswap V3 (WETH/USDC pool)
      ↓
4. Trading fees accumulate (from bot + organic volume)
      ↓
5. Vault rebalances: Collects fees
      ↓
6. Fee Distribution:
   - 90% → Stakers (as USDC yield)
   - 10% → Paymaster (as ETH for gas sponsorship)
      ↓
7. Paymaster sponsors user transactions (mint/craft/stake/claim)
      ↓
8. Loop continues indefinitely ♻️
```

**Key Difference from Traditional Models:**
- ❌ **Old Way**: External script withdraws USDC, swaps to ETH, deposits to Paymaster (3 transactions, manual intervention)
- ✅ **New Way**: Vault automatically unwraps 10% of WETH fees to ETH and deposits to Paymaster during rebalance (1 transaction, fully automated)

### Smart Contract Ecosystem

#### 1. YieldVault Contract (The Heart of the System)

**Purpose**: NFT staking, yield distribution, Uniswap V3 integration, **and automated tax recycling**

**Core Innovation - Integrated Tax Recycling:**
```solidity
function rebalance() external onlyOwner {
    // 1. Collect trading fees from Uniswap position
    (uint256 wethFees, uint256 usdcFees) = _collectFees();

    // 2. Convert USDC fees to WETH for uniform processing
    if (usdcFees > minSwapAmount) {
        wethFees += _swapUSDCToWETH(usdcFees);
    }

    // 3. Calculate 10% tax for Paymaster
    uint256 paymasterTax = wethFees / 10;
    uint256 stakerReward = wethFees - paymasterTax;

    // 4. Unwrap tax to native ETH
    IWETH(WETH).withdraw(paymasterTax);

    // 5. Deposit ETH directly to Paymaster's EntryPoint
    IEntryPoint(ENTRY_POINT).depositTo{value: paymasterTax}(PAYMASTER);

    // 6. Distribute remaining 90% to stakers
    if (sTotalWeight > 0) {
        sAccRewardPerWeight += (stakerReward * 1e18) / sTotalWeight;
    }

    emit Rebalanced(sLastPositionId, wethFees, stakerReward, paymasterTax);
}
```

**Critical Fix - The Receive Loop Bug:**
Early versions had a fatal bug where the `receive()` function would re-wrap withdrawn ETH:
```solidity
// ❌ BROKEN: Infinite loop
receive() external payable {
    IWETH(WETH).deposit{value: msg.value}(); // Wraps ALL incoming ETH
}

// When vault calls WETH.withdraw():
// 1. WETH sends ETH to vault
// 2. receive() triggers
// 3. ETH immediately re-wrapped to WETH
// 4. Paymaster deposit fails (balance = 0)
```

**The Fix:**
```solidity
// ✅ FIXED: Ignore WETH withdrawals
receive() external payable {
    // Only wrap if ETH came from somewhere OTHER than WETH contract
    if (msg.sender != address(WETH) && msg.value > 0) {
        IWETH(address(WETH)).deposit{value: msg.value}();
    }
}
```

**Verified Tax Flow** (Arbitrum Sepolia Transaction Example):
1. **Fees Collected**: 171,407,864,842,163 Wei (WETH)
2. **Tax Calculated**: 17,140,786,484,216 Wei (exactly 10%)
3. **WETH Unwrapped**: Tax amount converted to native ETH
4. **Deposited to EntryPoint**: Full tax amount deposited for Paymaster

**Event Logs:**
- `Collect`: Position #223662 collected fees
- `Withdrawal`: WETH unwrapped to ETH
- `Deposited`: EntryPoint received ETH for Paymaster
- `Rebalanced`: Event emitted with `treasuryTax: 17140786484216`

#### 2. AlchemyPaymaster Contract

**Purpose**: Sponsors gas for whitelisted operations

**Gas Sponsorship Rules:**
- ✅ **Sponsored (Free Gas):** `mint()`, `craft()`, `stake()`, `unstake()`, `claimYield()`, `burnForConfidential()`, `spendForGovernance()`, `castVote()`
- ❌ **Not Sponsored:** Generic `approve()`, `transfer()`, external swaps

**Sustainability:**
- Receives 10% of all Vault yields as native ETH
- No manual intervention required
- Self-refueling as long as trading volume exists

#### 3. ElementNFT Contract

**Purpose**: ERC-721 NFT with elemental metadata and tier tracking

**Key Functions:**
```solidity
function mint(uint8 elementIndex) external payable
// Mints a Tier 1 NFT for 0.002 ETH
// Fee sent directly to YieldVault

function getTokenTier(uint256 tokenId) external view returns (uint8)
// Returns 1, 2, or 3 based on NFT's tier

function getTokenElement(uint256 tokenId) external view returns (uint8)
// Returns 0-17 for the specific element
```

#### 4. Alchemist Contract

**Purpose**: Handles NFT burning and tier-up transmutation

**Core Mechanism:**
```solidity
function transmute(uint256[] memory tokenIds) external payable
// Requirements:
// - Exactly 3 NFTs provided
// - All must be same tier
// - Must pay 0.002 ETH
// - Caller must own all 3 NFTs

// Process:
// 1. Verify ownership and tier consistency
// 2. Burn all 3 NFTs permanently
// 3. Generate random element for new tier
// 4. Mint new NFT at (currentTier + 1)
// 5. Transfer fee to Yield Vault
```

### Account Abstraction (ERC-4337)

**The UX Revolution:**

Traditional Web3 requires users to hold ETH for gas, manually approve each transaction, and pay gas fees for every action. Alchemy Guild uses **Smart Accounts** to eliminate these friction points:

**Smart Account Flow:**
```
1. User connects wallet (MetaMask/Rainbow/etc.)
      ↓
2. Frontend deterministically generates Smart Account address
      ↓
3. User signs intent (no ETH required)
      ↓
4. Bundler submits UserOperation to EntryPoint
      ↓
5. Paymaster verifies and sponsors gas
      ↓
6. Transaction executes (user pays 0 gas)
```

**Technical Stack:**
- `permissionless.js`: Smart Account client library
- `viem`: Low-level Ethereum interactions
- `Pimlico`: Bundler & Paymaster service (Arbitrum Sepolia)
- `SimpleAccount v0.7`: Account implementation

**Key Benefit**: Users can mint, craft, stake, and claim without ever holding ETH for gas.

### Uniswap V3 Yield Generation

**The Liquidity Strategy:**

The vault acts as a liquidity provider on Uniswap V3's WETH/USDC 0.3% fee pool.

**Position Lifecycle:**

**1. Initial Position Creation (First Rebalance):**
```solidity
// Triggered by bot after sufficient liquidity accumulated
function rebalance() external onlyOwner {
    // Get current price
    (, int24 tick, , , , , ) = POOL.slot0();

    // Set price range (±500 ticks for 0.3% pool)
    int24 tickLower = nearestUsableTick - 500;
    int24 tickUpper = nearestUsableTick + 500;

    // Allocate funds
    uint256 usdcForPosition = (USDC.balance * 80) / 100; // 80% to position
    uint256 usdcReserve = USDC.balance * 20 / 100;       // 20% kept liquid

    // Create position ONLY if none exists
    if (sLastPositionId == 0) {
        (sLastPositionId, , , ) = POSITION_MANAGER.mint({
            token0: USDC,
            token1: WETH,
            fee: 3000, // 0.3%
            tickLower: tickLower,
            tickUpper: tickUpper,
            amount0Desired: usdcForPosition,
            amount1Desired: wethBalance,
            amount0Min: 0,
            amount1Min: 0,
            recipient: address(this),
            deadline: block.timestamp
        });
    }
}
```

**2. Fee Collection (Subsequent Rebalances):**
```solidity
// On every rebalance after position exists
if (sLastPositionId != 0) {
    // Collect accumulated trading fees
    POSITION_MANAGER.collect({
        tokenId: sLastPositionId,
        recipient: address(this),
        amount0Max: type(uint128).max, // Collect all available
        amount1Max: type(uint128).max
    });
}

// Measure collected fees
uint256 usdcFees = USDC.balanceOf(address(this)) - balanceBefore;
uint256 wethFees = WETH.balanceOf(address(this)) - balanceBefore;
```

**3. Fee Distribution:**
```solidity
// Convert all fees to WETH for uniform processing
if (usdcFees > minSwapAmount) {
    wethFees += _swapUSDCToWETH(usdcFees);
}

// Calculate tax (10% to Paymaster)
uint256 tax = wethFees / 10;
uint256 stakerReward = wethFees - tax;

// Unwrap tax to ETH and deposit to Paymaster
IWETH(WETH).withdraw(tax);
IEntryPoint(ENTRY_POINT).depositTo{value: tax}(PAYMASTER);

// Distribute 90% to stakers
if (sTotalWeight > 0) {
    sAccRewardPerWeight += (stakerReward * 1e18) / sTotalWeight;
}

emit Rebalanced(sLastPositionId, wethFees, stakerReward, tax);
```

**Fee Distribution Example:**
```
Uniswap pool generates: 0.0005 WETH + 1.0 USDC in fees
                              ↓
Vault collects fees:    0.0005 WETH + swap(1.0 USDC) = ~0.0009 WETH total
                              ↓
Paymaster tax (10%):    0.00009 WETH → Unwrap to ETH → EntryPoint
                              ↓
Staker distribution:    0.00081 WETH → Weight-based allocation
                              ↓
Global update:          sAccRewardPerWeight += (0.00081 * 1e18) / sTotalWeight
```

### The Automated Rebalancer (Volume Bot)

**Purpose**: Automates vault operations and generates trading volume for fee accrual.

**Bot Architecture:**
```javascript
Every 5 cycles:
  ├─ Swap WETH → USDC (create volume)
  ├─ Wait 5 seconds (RPC propagation)
  ├─ Swap USDC → WETH (reverse, minimize slippage)
  ├─ Wait 30 seconds
  └─ Call vault.rebalance() (collect fees + auto-recycle tax)
```

**Volume Generation Strategy:**
- Small swaps (0.001 WETH) to minimize gas costs
- Immediate reversal to maintain capital neutrality
- Generates ~0.0006% fee per round trip (0.3% pool × 2 swaps)
- Accumulates fees for stakers over time

---

## Part 3: Production Status & Arbitrum Sepolia Migration

### Deployed Contracts (Arbitrum Sepolia)

All core contracts are deployed and verified on **Arbitrum Sepolia (Chain ID: 421614)**:

- **YieldVault**: `0x2Ed51bD2CD7148197C8aBbF53D171e1c8bb41CdC`
- **GuildToken (GUILD)**: `0x39514660f913E651E098c710b03943bA5F451535`
- **cGUILD (iExec Nox)**: `0xD32B7929146E484eac13e59D0a0Ca116707CD286`
- **GuildDAO**: `0x11feE910D4d026ca7CC951ee0836a2094b898aC7`
- **ElementNFT**: `0x60c28DcF0c32bd305b49a3dCcABC1A4a10BdcBc3`
- **Alchemist**: `0xB20fCfFa104Ff37eA2ba3df54AC55379D4167765`
- **GuildDistributor**: `0x1d64980f2Dc19e7A38666e23Fcb443529222cdf6`
- **Verifying Paymaster**: `0xa9924829148A1a1Bd057EAC11B448084cDCbC60a`
- **USDC (Arbitrum Sepolia)**: `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d`
- **WETH (Arbitrum Sepolia)**: `0x980B62Da83eFf3D4576C647993b0c1D7faf17c73`
- **Uniswap V3 Pool**: `0x66EEAB70aC52459Dd74C6AD50D578Ef76a441bbf` (WETH/GUILD 0.3%)
- **Leno AI Enclave v2**: `0x5e4B314B15DEB44e5E7dC688537F55fD72A3ffbb` / `0x98bF34958f23bbDF82B026C15ec970cAbF698020`

### Verified Functionality

- ✅ Gasless minting/transmutation/staking via Smart Accounts
- ✅ Automated rebalancing (with iExec Nox encrypted target ticks)
- ✅ Fee collection and distribution (90% to stakers, 10% to Paymaster)
- ✅ **Integrated tax recycling** (WETH $\rightarrow$ ETH $\rightarrow$ Paymaster deposit)
- ✅ **Confidential Voting & Tallying**: Votes are cast as encrypted handles (`euint256`), tallying is executed inside the secure Intel TDX hardware enclave.
- ✅ **Delegated Agent Governance**: O(1) viewing key delegation directly to the whitelisted **Leno AI Enclave v2** for autonomous voting prediction.

### Dynamic Staking Index Mechanics

With low total staked weight, the index grows rapidly. This is mathematically correct:

$$\Delta_{index} = \frac{\text{Yield}}{W_{total}}$$

As more users stake (Total Weight $W_{total} \rightarrow 1,000,000$):
- Same yield: 1.7 USDC
- Index Increase: 
  $$\Delta_{index} = \frac{1,700,000 \text{ (micros)}}{1,000,000} = 1.7$$

---

## Part 4: Frontend Architecture

**Tech Stack:**
- **React 18** + **TypeScript**
- **Vite**
- **Wagmi v2** + **Viem**
- **Reown AppKit** (Wallet connection UI)
- **Recharts** (Data visualization)
- **TailwindCSS** (Void-black backgrounds with gold accents `#d4af37`)
- **permissionless.js** (Smart Account Client)

**Page Structure:**
1. **Landing Page**: Cinematic hero section and app gateway
2. **Dashboard**: TVL, Staked Weight, Mint Stats, and Smart Wallet balance
3. **Inventory**: Grid of owned element NFTs with filter options
4. **The Vault** (Staking): Staking panel and real-time yield harvest
5. **The Lab** (Crafting): Transmutation engine with 3-to-1 recipe mechanics
6. **Governance**: Shielding Lab, active proposals list, and secure AI delegation
7. **Analytics**: Live Oracle price feed, GUILD Burned metric, and Backing Reserves (POL)

---

## Part 5: Security & Auditing

### Security Measures

1. **Reentrancy Protection:**
```solidity
function stake(...) external nonReentrant {
    // Prevents recursive calls during execution
}
```

2. **Balance Capping:**
```solidity
uint256 vaultBalance = USDC.balanceOf(address(this));
uint256 payout = pending > vaultBalance ? vaultBalance : pending;
```

3. **Ownership Verification:**
```solidity
require(I_ELEMENT_NFT.ownerOf(tokenId) == msg.sender, "Not owner");
```

---

## Part 6: Economic Analysis

### Revenue Streams

1. **Minting Fees:**
- 0.002 ETH per Tier 1 mint $\rightarrow$ 100% goes to Vault liquidity

2. **Crafting Fees:**
- 0.002 ETH per transmutation $\rightarrow$ 100% goes to Vault liquidity

3. **Trading Fees:**
- 0.3% on all Uniswap swaps $\rightarrow$ 90% to stakers, 10% funds gas sponsorship

### Sustainability Model

$$\text{User Fees} \rightarrow \text{Vault Liquidity} \rightarrow \text{Trading Fees} \rightarrow \text{Gas Sponsorship} \rightarrow \text{User Adoption} \rightarrow \text{More Fees}$$

### Break-Even Analysis

```
Paymaster Gas Costs (per day):
- Average gas per UserOp: ~150,000 gas
- Base gas price: ~0.001 gwei (Arbitrum Sepolia)
- Cost per UserOp: ~0.00015 ETH
- 100 UserOps/day: ~0.015 ETH/day

Required Trading Volume (to sustain):
- 10% tax on fees must cover 0.015 ETH/day
- Required fees: 0.15 ETH/day
- At 0.3% fee tier: 0.15 / 0.003 = 50 ETH daily volume
- With $2,000 ETH: $100,000 daily volume
```

---

<div align="center">
  <h3><b>Transmuting Base Assets & Plaintext State into Gold & Confidentiality.</b></h3>
  <p>Built with ❤️ for the WTF!! Summer Hackathon & Metana Capstone.</p>
</div>

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAaCAYAAAAue6XIAAAC4klEQVR4Xu2WTYhNYRjHrxkfIURyud8fo9ENoy7ZSINIElaSlGShUIpENlYkG4sZZaFJXSnR5GsjQ4ksyEoU0awwLIyPZkFp/B7znts7f/fOPerexdT91dO55/9/zvM+73vOee+JRJqMA4rF4qR0On09n88n1atGKpWaTdxoa2ubqV5DodHzmUxmm+oB+FnVDJpdR9zlZ6t6DYFGdhK9qre3t89gAp14F4lB9QPwesg7rnpN7JZw8QniCgVucnxAPGb2xyKVZ9+C/57cjb7I+TL0T1aHeEV89X0fcldabiKRmKpeVWhoFxe+4cIjnLYEeiwWm4v2nOhjMlO8SyLJZHIL+lt+TvB1H/zbYzVr4PcTB1WvCIlniY80u0g9A28tMcyETopeIrp8TQnTLHUvkXNf9X8gaa81ks1mN6gXYCdKzm/ima9z/rrWioRp1vXwTfVR2EqSNEQ8Uc8nGo1OtwkRnwMtl8vNMo0aW/1cJUyzLNRqV2u+emVI6HJJ+9TzCYoRjzytwzTz/FwlZLNLrRbvwGL1AlpJGHBNVNwHA5jMGZdXfj4pvMI03uIlfq7imh3zFnOXUlaLcTrV+wtv+TTXwDCnE9UPsFuTHnlUfvmNeSvb4ecrYZqNx+MJq2V/EuqVIeGFW52qexx+t5v1qI3b/lpds2Eeg++q+9jtt1ocl6tXhoRTlkRxUs9A3+9mfEG94KXD26yej2v2h+o+1FhltViAeeqVcY/CO+Kl/yYWCoXJFDiN/MpM4HKmy6eP1k3dIdR9y7hFDNjn1Ahh7d9rbaarCbYwy4DniYWbkL7bE8SrHo8QCzffB7yEuq85jNcfq4Q3airn4Yo3bKmo+ejdj3lK9rjDAHlsR+0RU73+gzlNih+p1xX34DLBa29ULC3dhITU+RMbYkeoGAx0g7qgeFvsusGdW9UZhn4m9DLpejVpw3RqipHpDsX2aQa+xT8bUq4a9hFzTZzuSek2ajHf+AI8lyAtaeSvZAAAAAElFTkSuQmCC>
