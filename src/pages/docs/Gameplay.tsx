
import { motion } from 'framer-motion';

export default function Gameplay() {
    return (
        <div className="space-y-8 text-foreground">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-4xl font-bold mb-4 text-primary">Gameplay Mechanics</h1>
                <p className="text-xl text-muted-foreground">
                    Master the art of transmutation to ascend the Alchemist ranks.
                </p>
            </motion.div>

            <div className="space-y-12">
                {/* Elements Section */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-border pb-2"> Elemental Hierarchy</h2>
                    <p className="text-muted-foreground">
                        The world consists of 18 unique elements across 3 tiers. Higher tier elements are rarer and command greater power in the Guild.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="bg-card/50 p-4 rounded-lg border border-border">
                            <span className="text-xs uppercase tracking-wider text-muted-foreground">Tier 1</span>
                            <h3 className="text-lg font-bold text-blue-400 mt-1">Base Elements</h3>
                            <p className="text-sm text-muted-foreground mt-2">Water, Fire, Earth, Wind, Lightning, Ice</p>
                            <div className="mt-3 text-xs bg-blue-500/10 text-blue-300 px-2 py-1 rounded w-fit">Mint Cost: 0.002 ETH</div>
                        </div>
                        <div className="bg-card/50 p-4 rounded-lg border border-border">
                            <span className="text-xs uppercase tracking-wider text-muted-foreground">Tier 2</span>
                            <h3 className="text-lg font-bold text-purple-400 mt-1">Compounds</h3>
                            <p className="text-sm text-muted-foreground mt-2">Plasma, Blizzard, Inferno, Tsunami, Quake, Tornado</p>
                            <div className="mt-3 text-xs bg-purple-500/10 text-purple-300 px-2 py-1 rounded w-fit">Crafted via Ritual</div>
                        </div>
                        <div className="bg-card/50 p-4 rounded-lg border border-border">
                            <span className="text-xs uppercase tracking-wider text-muted-foreground">Tier 3</span>
                            <h3 className="text-lg font-bold text-amber-400 mt-1">Primordials</h3>
                            <p className="text-sm text-muted-foreground mt-2">Time, Space, Void, Nova, Spirit, Holy</p>
                            <div className="mt-3 text-xs bg-amber-500/10 text-amber-300 px-2 py-1 rounded w-fit">Ultimate Power</div>
                        </div>
                    </div>
                </section>

                {/* Crafting Section */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-border pb-2">🧪 The Transmutation Ritual</h2>
                    <p className="text-muted-foreground">
                        At the Lab, you can perform transmutation rituals to combine lower-tier elements into higher ones.
                        Every ritual requires sacrificing specific elements.
                    </p>

                    <div className="bg-secondary/20 rounded-xl p-6 border border-primary/20">
                        <h3 className="font-mono text-lg mb-4 text-primary">Recipe Logic</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                                <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono">T1 &rarr; T2</span>
                                <span>Combine <strong>2 identical</strong> elements + <strong>1 complementary</strong> (e.g., 2 Water + 1 Wind = Tsunami)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">T2 &rarr; T3</span>
                                <span>Combine <strong>1 Tier 1</strong> and <strong>2 Tier 2</strong> elements (e.g., Tsunami + Blizzard + Tornado = Time)</span>
                            </li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
}
