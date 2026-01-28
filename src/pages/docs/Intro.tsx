
import { motion } from 'framer-motion';

export default function Intro() {
    return (
        <div className="space-y-8 text-foreground">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                    Welcome to Alchemy Guild
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                    A gamified DeFi protocol where you collect, craft, and stake elemental NFTs to earn real yield.
                </p>
            </motion.div>

            <div className="prose prose-invert max-w-none space-y-6">
                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-primary/90">The Vision</h2>
                    <p className="text-muted-foreground leading-7">
                        Alchemy Guild transforms traditional DeFi liquidity mining into an immersive alchemy simulation.
                        Instead of just depositing tokens, you become an Alchemist in a world of elements.
                        By mastering the transmutation of Water, Fire, Earth, and Wind, you unlock higher tiers of power and yieldshare.
                    </p>
                </section>

                <section className="grid md:grid-cols-2 gap-6 mt-8">
                    <div className="p-6 rounded-xl bg-card border border-border/50">
                        <h3 className="text-lg font-medium mb-2 text-primary">🏰 The Gameplay</h3>
                        <p className="text-sm text-muted-foreground">
                            Collect base elements, craft them into powerful compounds like Plasma or Time, and build your ultimate deck.
                        </p>
                    </div>
                    <div className="p-6 rounded-xl bg-card border border-border/50">
                        <h3 className="text-lg font-medium mb-2 text-primary">💰 The Economics</h3>
                        <p className="text-sm text-muted-foreground">
                            Powered by a real Uniswap V3 vault. Staking your NFTs earns you a share of actual trading fees, not just inflationary tokens.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
