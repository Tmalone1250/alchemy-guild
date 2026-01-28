
import { motion } from 'framer-motion';

export default function Staking() {
    return (
        <div className="space-y-8 text-foreground">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-4xl font-bold mb-4 text-primary">The Vault & Yield</h1>
                <p className="text-xl text-muted-foreground">
                    Stake your elemental NFTs to earn a share of the protocol's revenue.
                </p>
            </motion.div>

            <div className="space-y-12">
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-border pb-2">How It Works</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        The Vault serves as the central treasury of the Guild. When you stake your NFTs, you are effectively
                        depositing them into a smart contract that tracks your ownership and calculates your share of the global rewards.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-border pb-2">Yield Weight System</h2>
                    <p className="text-muted-foreground">
                        Not all elements are equal. Higher tier elements carry more "Weight" in the vault, entitling you to a larger slice of the rewards pie.
                    </p>

                    <div className="overflow-hidden rounded-lg border border-border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Element Tier</th>
                                    <th className="px-4 py-3 font-medium">Yield Weight</th>
                                    <th className="px-4 py-3 font-medium">Reward Share</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                <tr className="bg-card/50">
                                    <td className="px-4 py-3">Tier 1 (Base)</td>
                                    <td className="px-4 py-3 font-mono text-primary">10</td>
                                    <td className="px-4 py-3">1x</td>
                                </tr>
                                <tr className="bg-card/50">
                                    <td className="px-4 py-3">Tier 2 (Compound)</td>
                                    <td className="px-4 py-3 font-mono text-purple-400">35</td>
                                    <td className="px-4 py-3">3.5x</td>
                                </tr>
                                <tr className="bg-card/50">
                                    <td className="px-4 py-3">Tier 3 (Primordial)</td>
                                    <td className="px-4 py-3 font-mono text-amber-400">150</td>
                                    <td className="px-4 py-3">15x</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="bg-primary/5 rounded-xl p-6 border border-primary/10">
                    <h3 className="text-lg font-semibold mb-2 text-primary">Real Yield, No Inflation</h3>
                    <p className="text-sm text-muted-foreground">
                        Unlike many DeFi protocols that print new tokens to pay stakers (diluting value), Alchemy Guild distributes <strong>USDC</strong>.
                        This USDC comes from:
                    </p>
                    <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
                        <li>Initial minting fees (Partial)</li>
                        <li>Uniswap V3 trading fees from protocol-owned liquidity</li>
                        <li>Crafting ritual fees</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}
