
import { motion } from 'framer-motion';

export default function Economics() {
    return (
        <div className="space-y-8 text-foreground">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-4xl font-bold mb-4 text-primary">Protocol Economics</h1>
                <p className="text-xl text-muted-foreground">
                    A sustainable model built on real revenue and deflationary assets.
                </p>
            </motion.div>

            <div className="space-y-12">
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-border pb-2">Revenue Streams</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-5 rounded-lg border border-border bg-card">
                            <h3 className="font-bold text-lg mb-2">1. Minting Costs</h3>
                            <p className="text-sm text-muted-foreground">
                                Players pay a small fee (0.002 ETH) to conjure base elements. <strong>100% of this fee</strong> is automatically injected into the Uniswap V3 Yield Vault to boost staking rewards.
                            </p>
                        </div>
                        <div className="p-5 rounded-lg border border-border bg-card">
                            <h3 className="font-bold text-lg mb-2">2. Trading Fees</h3>
                            <p className="text-sm text-muted-foreground">
                                The Protocol manages a concentrated liquidity position on Uniswap V3. 90% of fees go to Stakers.
                            </p>
                        </div>
                        <div className="p-5 rounded-lg border border-border bg-card">
                            <h3 className="font-bold text-lg mb-2">3. Sustainable Gas</h3>
                            <p className="text-sm text-muted-foreground">
                                10% of all Yield is taxed to fund the <strong>Paymaster</strong>. This ensures the protocol can sponsor gas fees indefinitely.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-border pb-2">Supply Deflation</h2>
                    <p className="text-muted-foreground">
                        The crafting mechanism acts as a persistent sink for NFTs, ensuring scarcity increases over time.
                    </p>

                    <div className="relative p-8 rounded-xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 text-center">
                        <div className="text-3xl font-bold mb-2">3 Burned → 1 Minted</div>
                        <p className="text-muted-foreground">
                            Every time a player ascends to a higher tier, 3 lower-tier NFTs are permanently removed from circulation.
                        </p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-border pb-2">Sustainability</h2>
                    <p className="text-muted-foreground">
                        Unlike P2E (Play-to-Earn) models that rely on infinite token emissions, Alchemy Guild's yield is bounded by actual ecosystem revenue.
                        If trading activity or minting slows, yield lowers organically rather than collapsing due to hyperinflation.
                    </p>
                </section>
            </div>
        </div>
    );
}
