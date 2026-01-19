# 🧪 Alchemy Vault - Gamified DeFi Yield System

[![Solidity](https://img.shields.io/badge/Solidity-0.8.30-blue)](https://soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Foundry-Latest-orange)](https://getfoundry.sh/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.0-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> Transform your liquidity into alchemical gold through gamified DeFi staking and NFT crafting.

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Smart Contracts](#smart-contracts)
- [Test Results](#test-results)
- [Frontend Dashboard](#frontend-dashboard)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Tech Stack](#tech-stack)
- [License](#license)

---

## 🎯 Overview

**Alchemy Vault** is a gamified Automated Liquidity Manager (ALM) built on Uniswap V3. It combines DeFi yield farming with RPG-style progression mechanics, where users mint elemental NFTs, craft them into higher tiers, and stake them to earn USDC rewards from Uniswap V3 liquidity fees.

### The Alchemist's Journey

1. **Mint** - Start with Tier 1 elemental NFTs (Earth, Fire, Water, Air, Lightning, Ice)
2. **Craft** - Combine 3 NFTs to transmute them into 1 higher-tier NFT
3. **Stake** - Lock your NFTs to earn USDC from Uniswap V3 LP fees
4. **Evolve** - Progress through 18 elements across 3 tiers with increasing rewards

---

## ✨ Features

### 🎮 Gamification
- **3 Tiers**: Lead (100 weight), Silver (135 weight), Gold (175 weight)
- **18 Elements**: 6 per tier with unique crafting recipes
- **Progressive Evolution**: Craft your way from apprentice to master
- **Reward Multipliers**: Higher tiers earn more USDC

### 💰 DeFi Mechanics
- **Uniswap V3 Integration**: Automated liquidity management
- **USDC Rewards**: Earn stable yields from trading fees
- **Auto-Rebalancing**: Concentrated liquidity optimization
- **Treasury System**: 10% tax funds operational costs

### 🎨 Beautiful UI
- **Modern Dashboard**: Next.js 14 with RainbowKit
- **Real-time Data**: Live balance and reward tracking
- **Responsive Design**: Mobile-friendly interface
- **Alchemy Theme**: Mystical glassmorphism effects

---

## 📜 Smart Contracts

### Deployed on Sepolia Testnet

| Contract | Address | Description |
|----------|---------|-------------|
| **Treasury** | `0xBBDb619847CFC6F7e1F0f909684fE7d1418667B6` | Fee collection & storage |
| **ElementNFT** | `0x055fdAE960FF3d9d60F160173B7629Bc1440d99A` | ERC721 with tier/element |
| **Alchemist** | `0xdB4Ab958339613246Ca056582dBdE6C1FD3a6dC6` | Crafting system |
| **YieldVault** | `0x15e771dA9D40074db4Deb0e81EE4Ca4aC0a4937F` | Staking & rewards |

### Contract Architecture

```
ElementNFT (ERC721)
    ├── Tier & Element attributes
    ├── Role-based access control
    └── Minting/Burning by authorized contracts

AlchemistContract
    ├── Crafting: 3 NFTs → 1 higher-tier NFT
    ├── 12 valid recipes
    └── 0.002 ETH crafting fee

YieldVault
    ├── Stake NFTs to earn USDC
    ├── Uniswap V3 integration
    ├── Tier-based reward weights
    └── Automated rebalancing

AlchemistTreasury
    └── Receives 10% of rebalance fees
```

---

## 🧪 Test Results
### Comprehensive Test Suite: 47 Tests, 100% Passing ✅

| Test Type | Count | Runs | Description |
|-----------|-------|------|-------------|
| **Unit Tests** | 26 | - | Core functionality testing |
| **Fuzz Tests** | 5 | 256 each | Random input validation |
| **Integration Tests** | 6 | - | End-to-end workflows |
| **Invariant Tests** | 5 | 3,840 calls | Property-based testing |
| **Fork Tests** | 6 | - | Real Uniswap V3 on Sepolia |

<details>
<summary><b>📊 Detailed Test Results</b></summary>

#### YieldVault Tests (9 tests)
```
✅ testGetPendingRewardZero()
✅ testGetTierWeight()
✅ testMultipleStakes()
✅ testRevertClaimYieldNoRewards()
✅ testRevertClaimYieldNotOwner()
✅ testRevertStakeWrongTier()
✅ testRevertUnstakeNotOwner()
✅ testStakeNFT()
✅ testUnstake()
```

#### AlchemistContract Tests (17 tests)
```
✅ testContractReceivesETH()
✅ testCraftBio() - Tier III
✅ testCraftBlizzard() - Tier II
✅ testCraftDark() - Tier III
✅ testCraftGravity() - Tier III
✅ testCraftHoly() - Tier III
✅ testCraftInferno() - Tier II
✅ testCraftPlasma() - Tier II
✅ testCraftQuake() - Tier II
✅ testCraftSpirit() - Tier III
✅ testCraftTime() - Tier III
✅ testCraftTornado() - Tier II
✅ testCraftTsunami() - Tier II
✅ testRecipeOrderIndependent()
✅ testRevertInsufficientETH()
✅ testRevertInvalidRecipe()
✅ testRevertNotTokenOwner()
```

#### Fuzz Tests (5 tests, 256 runs each = 1,280 variations)
```
✅ testFuzz_CraftWithValidTier1Elements(uint8,uint8,uint8)
✅ testFuzz_CraftingFeeValidation(uint256)
✅ testFuzz_MultipleSequentialCrafts(uint8)
✅ testFuzz_RecipeOrderIndependence(uint8)
✅ testFuzz_TokenOwnershipValidation(address)
```

#### Integration Tests (6 tests)
```
✅ test_E2E_AccessControl()
✅ test_E2E_CraftingFeesAccumulate()
✅ test_E2E_FullProgression()
✅ test_E2E_MintCraftAndStake()
✅ test_E2E_MultipleUsers()
✅ test_E2E_StakeUnstakeRestake()
```

#### Invariant Tests (5 tests, 19,200 state transitions)
```
✅ invariant_CraftingFeesAccumulate()
✅ invariant_CraftingTokenBalance()
✅ invariant_NoNegativeWeights()
✅ invariant_StakedNFTsOwnedByVault()
✅ invariant_TotalWeightMatchesSum()
```

#### Fork Tests (6 tests)
```
✅ testFork_ClaimYieldAfterRebalance()
✅ testFork_EmergencyWithdraw()
✅ testFork_MultipleRebalances()
✅ testFork_RebalanceWithNoLiquidity()
✅ testFork_StakeAndRebalance()
✅ testFork_VerifyUniswapDeployment()
```

**Total: 47 tests passed, 0 failed**

</details>

### Run Tests Locally

```bash
# All tests
forge test -vv

# Specific test file
forge test --match-contract AlchemistContractTest -vv

# With gas report
forge test --gas-report

# Fork tests (requires SEPOLIA_RPC_URL in .env)
forge test --match-contract Fork --fork-url $SEPOLIA_RPC_URL -vv
```


⚗️ Alchemy Vault: Gamified Yield Transmutation
Welcome to the Alchemy Vault, a DeFi-RPG experience where your liquidity isn't just a number—it's the fuel for your Alchemical journey. Perform the "Great Work" by providing liquidity, and watch as volatile market "Lead" (WETH fees) is transmuted into stable "Gold" (USDC Rewards).

🎮 The Alchemist's Path (Gamification Layers)
1. Character Tiers & Multipliers
Your ElementNFT is your character card. Its tier determines your "Potency" (Reward Weight) in the ecosystem.

Tier 1 (The Apprentice): Base yield. You are learning the secrets of the vault.

Tier 2 (The Adept): +35% Bonus Yield. You have unlocked silver-grade transmutation.

Tier 3 (The Master): +75% Bonus Yield. You have achieved the golden state, capturing the highest possible share of global fees.

2. The Transmutation Ritual (Rebalancing)
Rebalancing is no longer a chore—it’s a ritual. Every time the vault rebalances, it performs The Consolidation:

Harvesting: Gathering the raw "Lead" (WETH) from market volatility.

Transmutation: Swapping volatile WETH into pure USDC.

The Sacrifice: A 10% tax is sent to the Alchemist Treasury to fund the realm (gasless operations).

The Distribution: Remaining gold is distributed to all staked Alchemists based on their Tier Potency.

3. Progressive Evolution
The vault is designed for a Retention Loop. Holders are incentivized to keep their NFTs staked to maintain their "Streak" of rewards.

Stake to Earn: Lock your NFT to begin accumulating transmuted Gold.

Evolve: Use the Alchemist Contract (sold separately) to upgrade your NFT from Tier 1 to Tier 3, permanently supercharging your yield.

🛠️ The Mechanics of the Realm
The Alchemist Treasury (The Gas Tank)
The Treasury is the heart of our Gasless UX. By collecting the 10% sacrifice from rebalances, it fuels the "Spells" (Transactions) that keep the vault automated, ensuring users never have to worry about manual rebalancing costs.

Technical Power-Ups
Concentrated Liquidity: Like a high-level spell, we concentrate your capital into narrow price ranges for 10x higher efficiency.

Auto-Accounting: The accRewardPerWeight index tracks your "XP" (Pending Rewards) in real-time.

📜 How to Join the Guild
Mint your ElementNFT: Start your journey with a Tier 1 NFT.

Stake in the Vault: Visit the Dashboard and lock your NFT.

Claim your Gold: As the volume bot trades, claim your transmuted USDC profits.


---

## 🎨 Frontend Dashboard

A mystical, gamified Web3 dashboard built with Next.js 14 and modern Web3 libraries.

### Dashboard Features

| Feature | Description |
|---------|-------------|
| 💰 **Wallet Connection** | RainbowKit integration with balance display |
| � **NFT Inventory** | Grid view of all your ElementNFTs |
| 🔥 **Staking Panel** | Stake NFTs and claim USDC rewards |
| ✨ **Crafting System** | Combine 3 NFTs into 1 higher-tier NFT |
| 📊 **Vault Statistics** | Real-time global metrics |
| 🎯 **Mint Helper** | Guide for new users |

### Screenshots

<details>
<summary><b>🖼️ View Dashboard Preview</b></summary>

*Dashboard features a dark theme with gold accents, glassmorphism effects, and smooth animations.*

</details>

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- Sepolia ETH for transactions

### Backend (Smart Contracts)

```bash
# Clone the repository
git clone <your-repo-url>
cd alchemy-vault

# Install Foundry dependencies
forge install

# Run tests
forge test -vv

# Deploy (optional - already deployed)
forge script script/DeployAlchemy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast
```

### Frontend (Dashboard)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your WalletConnect Project ID
# Get one free at: https://cloud.walletconnect.com/

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see your dashboard!

### Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_ELEMENT_NFT_ADDRESS=0xB3b63D62D95aE9fa9B626fD5d8eB2446D65AB3ff
NEXT_PUBLIC_ALCHEMIST_CONTRACT_ADDRESS=0x06B0FC0Ad046A51cf90B2e6c65A4bF56c839ED6B
NEXT_PUBLIC_YIELD_VAULT_ADDRESS=0xEaf61548fF529Bb6F2aE9ed8fE675E4f17630D1E
NEXT_PUBLIC_TREASURY_ADDRESS=0xcdAeA5Ea715CCF73f07933673106B4574d699007
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [COMPLETE_PROJECT_GUIDE.md](./COMPLETE_PROJECT_GUIDE.md) | Comprehensive project documentation |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Step-by-step deployment guide |
| [TEST_GUIDE.md](./TEST_GUIDE.md) | Testing documentation |
| [TESTING_SUMMARY.md](./TESTING_SUMMARY.md) | Test results and coverage |
| [FRONTEND_SUMMARY.md](./FRONTEND_SUMMARY.md) | Frontend technical details |
| [frontend/README.md](./frontend/README.md) | Frontend setup guide |
| [frontend/QUICKSTART.md](./frontend/QUICKSTART.md) | 5-minute quick start |

---

## 🛠️ Tech Stack

### Smart Contracts
- **Solidity** 0.8.30
- **Foundry** - Development framework
- **OpenZeppelin** - Security libraries
- **Uniswap V3** - DEX integration

### Frontend
- **Next.js** 14.2.0 - React framework
- **Wagmi** v2 - React hooks for Ethereum
- **Viem** - TypeScript Ethereum library
- **RainbowKit** - Wallet connection
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

### Testing
- **Forge** - Unit & integration tests
- **Fuzz Testing** - Random input validation
- **Invariant Testing** - Property-based testing
- **Fork Testing** - Real network simulation

---

## 🎮 How to Use

### 1. Get Sepolia ETH
- Visit [Sepolia Faucet](https://sepoliafaucet.com/)
- Get test ETH for transactions

### 2. Mint Your First NFT
- Visit [ElementNFT on Etherscan](https://sepolia.etherscan.io/address/0xB3b63D62D95aE9fa9B626fD5d8eB2446D65AB3ff#writeContract)
- Connect wallet
- Call `mint(address to, uint8 tier, uint8 element)`
  - `to`: Your wallet address
  - `tier`: 1 (start with Tier 1)
  - `element`: 0-5 (Earth, Fire, Water, Air, Lightning, Ice)

### 3. Stake to Earn
- Open the dashboard
- Connect your wallet
- View your NFTs in the Inventory
- Go to Staking Panel
- Approve and stake your NFT
- Watch USDC rewards accumulate!

### 4. Craft Higher Tiers
- Select 3 same-tier NFTs from Inventory
- Go to Crafting Panel
- Click "Perform Transmutation"
- Pay 0.002 ETH
- Receive 1 higher-tier NFT!

### Crafting Recipes

<details>
<summary><b>⚗️ View All Recipes</b></summary>

#### Tier II Recipes (Tier 1 → Tier 2)
- **Plasma**: Water + Lightning + Lightning
- **Tornado**: Wind + Wind + Lightning
- **Blizzard**: Wind + Ice + Ice
- **Tsunami**: Water + Water + Wind
- **Quake**: Earth + Earth + Fire
- **Inferno**: Wind + Fire + Fire

#### Tier III Recipes (Tier 2 → Tier 3)
- **Holy**: Lightning + Plasma + Plasma
- **Dark**: Water + Tsunami + Tsunami
- **Gravity**: Earth + Quake + Quake
- **Time**: Wind + Tornado + Tornado
- **Bio**: Ice + Blizzard + Blizzard
- **Spirit**: Fire + Inferno + Inferno

</details>

---

## 🏗️ Project Structure

```
alchemy-vault/
├── src/                          # Smart contracts
│   ├── ElementNFT.sol           # ERC721 with tiers
│   ├── AlchemistContract.sol    # Crafting system
│   ├── YieldVault.sol           # Staking & rewards
│   └── AlchemistTreasury.sol    # Fee collection
├── test/                         # Test suite
│   ├── AlchemistContract.t.sol
│   ├── AlchemistContract.fuzz.t.sol
│   ├── YieldVault.t.sol
│   ├── YieldVault.fork.t.sol
│   ├── AlchemySystem.integration.t.sol
│   └── AlchemySystem.invariant.t.sol
├── script/                       # Deployment scripts
│   └── DeployAlchemy.s.sol
├── frontend/                     # Next.js dashboard
│   ├── app/                     # App router
│   ├── components/              # React components
│   ├── lib/                     # Utilities & ABIs
│   └── public/                  # Static assets
└── docs/                         # Documentation
```

---

## 🔒 Security Features

- ✅ **ReentrancyGuard** - Protection against reentrancy attacks
- ✅ **Access Control** - Role-based permissions
- ✅ **Pull over Push** - Safe payment pattern
- ✅ **Input Validation** - Comprehensive checks
- ✅ **Tested** - 47 tests with 100% pass rate
- ✅ **Audited Libraries** - OpenZeppelin contracts

---

## 🤝 Contributing

This is a capstone project for Metana.io. Contributions, issues, and feature requests are welcome!

---

## 📄 License

This project is licensed under the MIT License.

---

## 🎓 About

Built as a capstone project for [Metana.io](https://metana.io/) Solidity Bootcamp, demonstrating:
- Advanced Solidity development
- Comprehensive testing practices
- Modern Web3 frontend development
- DeFi protocol integration
- Professional documentation

---

## 🔗 Links

- **Sepolia Etherscan**: [View Contracts](https://sepolia.etherscan.io/)
- **Uniswap V3 Docs**: [Documentation](https://docs.uniswap.org/contracts/v3/overview)
- **Foundry Book**: [Learn Foundry](https://book.getfoundry.sh/)
- **Wagmi Docs**: [React Hooks](https://wagmi.sh/)

---

<div align="center">

**Built with ❤️ for the Metana.io Capstone Project**

*Transform your liquidity into alchemical gold* ⚗️

</div>
