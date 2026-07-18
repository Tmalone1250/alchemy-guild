# iExec Nox Integration Feedback

**Project:** Alchemy Guild (WTF!! Summer Hackathon)
**Network:** Arbitrum Sepolia

## 1. Overview: iExec Nox in Alchemy Guild
Alchemy Guild utilizes the iExec Nox Protocol to pioneer **Confidential TEE Governance** and **MEV-Protected Liquidity Rebalancing**. By leveraging Intel TDX hardware enclaves and `euint256` confidential handles, the protocol completely abstracts away the complexities of FHE (Fully Homomorphic Encryption) while delivering robust privacy for DeFi operations.

The core architecture relies on:
1. **cGUILD:** A shielded ERC-20 wrapper converting standard `GUILD` tokens into confidential `euint256` balances using Nox.
2. **GuildDAO:** The governance engine that accepts encrypted vote handles instead of plaintext votes.
3. **TEE Runner:** The off-chain Intel TDX enclave that decrypts and tallies votes without revealing individual weights.

---

## 2. What iExec Nox Solved for the Protocol

### 2.1 Eliminating Bandwagon Effects & Voter Intimidation
Traditional DAO governance relies on transparent, plaintext vote tallies. This inevitably leads to bandwagon effects (voters waiting to see the winning side) and whale intimidation (large holders swinging votes at the final block).
* **The Nox Solution:** When a user casts a vote in Alchemy Guild, exactly 10 `cGUILD` is burned from their confidential handle, and a new encrypted vote handle is pushed to the proposal. During the 3-day voting window, the public blockchain only sees `{N} Encrypted Vote Handles Sealed`. The plaintext `totalFor` and `totalAgainst` percentages remain 0% until the TEE Enclave resolves the proposal.

### 2.2 Enabling Secure AI Agent Delegation
Delegating voting power to automated bots traditionally requires exposing your exact holdings and strategies to the mempool.
* **The Nox Solution:** Using `Nox.allowThis()` and explicit `grantAccess` patterns, users delegate `O(1)` encrypted viewing rights directly to whitelisted autonomous AI Agent enclaves (e.g., Leno AI v2). The agent can securely analyze sentiment and cast votes programmatically inside a TEE without ever leaking the user's balances or strategic logic.

### 2.3 MEV-Protected Automated Market Operations
When rebalancing concentrated Uniswap V3 liquidity positions, standard protocols broadcast exact target ticks to the mempool, inviting MEV searchers to front-run and sandwich the operation.
* **The Nox Solution:** Alchemy Guild encrypts target ticks (`lowerTick`, `upperTick`) within confidential payloads. The rebalance parameters are computed and verified within the TEE, ensuring MEV bots cannot extract value from protocol-level liquidity adjustments.

---

## 3. Developer Experience & Feedback

### The Good
- **Intuitive Abstractions:** The `@iexec-nox/nox-protocol-contracts` and `@iexec-nox/handle` libraries provide a remarkably clean abstraction over deeply complex cryptographic mechanics. Working with `euint256` types and methods like `Nox.toEuint256()` felt native to Solidity.
- **Robustness:** Once the mental model of distinguishing between public state and confidential state is grasped, the protocol acts exactly as expected. The separation of concerns between on-chain storage and off-chain enclave computation is highly secure.
- **Ecosystem Compatibility:** Migrating to Arbitrum Sepolia to utilize the Nox precompiles was seamless, and the Foundry integration worked flawlessly.

### Challenges & Areas for Improvement
- **Cross-Contract Authorization Patterns:** Our biggest hurdle during the hackathon was managing authorization between separate contracts. Because `cGUILD` holds the confidential state but `GuildDAO` executes the logic, we frequently encountered `Only GuildDAO` reverts due to `msg.sender` context shifts. A standardized design pattern or Nox-specific library for cross-contract confidential authorization (e.g., a standardized Router/Wrapper architecture) would save developers significant debugging time.
- **Debugging Enclave Failures:** When a TEE Runner fails to resolve a proposal or decrypt a payload, debugging *why* it failed can be a black box from the smart contract side. Enhanced trace tools, local simulation environments that mimic TEE failures, or more descriptive on-chain revert reasons for failed enclave callbacks would greatly improve the DX.
- **Event Limits:** While building the frontend to read confidential interactions, we had to rely heavily on transaction logs and local caching (up to 7 days) because reading the state directly is intentionally blocked. Clearer guidelines in the documentation on how to optimally index and track `euint` interactions off-chain would be helpful for frontend developers.

## Conclusion
iExec Nox fundamentally transformed Alchemy Guild from a standard gamified yield protocol into a highly secure, MEV-resistant, and privacy-preserving DeFi ecosystem. The tooling is powerful, and with a few DX enhancements around cross-contract communication and debugging, it is positioned to become the gold standard for confidential Web3 computation.
