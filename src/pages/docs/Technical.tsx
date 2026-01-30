
import { motion } from 'framer-motion';

export default function Technical() {
    return (
        <div className="space-y-8 text-foreground">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-4xl font-bold mb-4 text-primary">Technical Architecture</h1>
                <p className="text-xl text-muted-foreground">
                    Under the hood: Smart Contracts, Uniswap Integration, and Security.
                </p>
            </motion.div>

            <div className="space-y-12">
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-border pb-2">Smart Contracts</h2>
                    <p className="text-muted-foreground">The protocol is built on a modular architecture of Solidity smart contracts.</p>

                    <div className="space-y-4 mt-4">
                        <div className="p-4 rounded border border-border bg-card/50">
                            <h3 className="font-mono text-primary font-bold">Smart Accounts (ERC-4337)</h3>
                            <p className="text-sm mt-1 text-muted-foreground">
                                Every user is assigned a Smart Account via `permissionless.js`. This allows for batched transactions
                                and enables the "Gasless" experience by decoupling the key (signer) from the wallet (executor).
                            </p>
                        </div>
                        <div className="p-4 rounded border border-border bg-card/50">
                            <h3 className="font-mono text-primary font-bold">AlchemyPaymaster</h3>
                            <p className="text-sm mt-1 text-muted-foreground">
                                A specialized contract that holds the guild's gas funds. It validates transactions against a whitelist
                                and "sponsors" the gas fees for Minting and Staking, so users don't need native ETH.
                            </p>
                        </div>
                        <div className="p-4 rounded border border-border bg-card/50">
                            <h3 className="font-mono text-primary font-bold">ElementNFT (ERC-721 Enumerable)</h3>
                            <p className="text-sm mt-1 text-muted-foreground">
                                Handles the NFT tokens themselves. Supports batch minting and burning.
                                Stores metadata on IPFS but maintains on-chain tracking of Element IDs and Tiers.
                            </p>
                        </div>
                        <div className="p-4 rounded border border-border bg-card/50">
                            <h3 className="font-mono text-primary font-bold">YieldVault</h3>
                            <p className="text-sm mt-1 text-muted-foreground">
                                The core logic for staking. It implements a standard yield farming algorithm,
                                using `accRewardPerWeight` to calculate pending rewards for any user in O(1) time complexity.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-border pb-2">The Reward Algorithm</h2>
                    <p className="text-muted-foreground">
                        We use the standard accumulating reward per share formula to ensure gas efficiency.
                    </p>

                    <div className="bg-black/50 p-4 rounded-lg font-mono text-sm border border-border overflow-x-auto">
                        <p className="text-green-400">// Upon any deposit/withdrawal:</p>
                        <p className="text-blue-300">updatePool()</p>
                        <p className="pl-4">accRewardPerShare += (NewRewards * 1e12) / TotalStakedWeight</p>
                        <br />
                        <p className="text-green-400">// Calculating User Pending Reward:</p>
                        <p className="pl-4">user.weight * (accRewardPerShare - user.rewardDebt)</p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-border pb-2">Uniswap V3 Integration</h2>
                    <p className="text-muted-foreground">
                        The Vault contract interacts directly with the Uniswap V3 `NonfungiblePositionManager`.
                        It automatically collects fees earned by the liquidity position and converts them into distributable rewards.
                    </p>
                </section>
            </div>
        </div>
    );
}
