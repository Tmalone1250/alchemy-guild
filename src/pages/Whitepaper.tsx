import { motion } from 'framer-motion';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Scroll, Droplets, Wind, Mountain, Flame, Snowflake, Zap, Gem, Clock } from 'lucide-react';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';

export default function Whitepaper() {
    return (
        <div className="relative min-h-screen bg-[#050308] text-[#e2e8f0]">
            <AnimatedBackground />

            {/* Navigation */}
            <div className="sticky top-0 z-50 bg-[#050308]/80 backdrop-blur-md border-b border-[#d4af37]/20">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-[#d4af37] hover:text-[#ffd700] transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-lato font-semibold uppercase tracking-wider text-sm">Back to Home</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-[#d4af37]" />
                        <span className="font-cinzel font-bold text-lg text-[#f0e6d2]">Guild Archives</span>
                    </div>
                </div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
                <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
                    <div className="space-y-12 pb-24">

                        {/* Header */}
                        <header className="text-center space-y-6 pt-12 pb-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center justify-center p-3 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 mb-4"
                            >
                                <Scroll className="w-8 h-8 text-[#d4af37]" />
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="font-cinzel text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-[#fbf5e9] via-[#d4af37] to-[#7c5e10]"
                            >
                                The Alchemy Guild
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="font-lato text-xl text-[#a8a0b0] max-w-2xl mx-auto"
                            >
                                A decentralized protocol merging elemental alchemy with automated market maker yield farming.
                            </motion.p>
                        </header>

                        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent" />

                        {/* Part 1: Gamified Experience */}
                        <section className="space-y-8">
                            <h2 className="font-cinzel text-3xl text-[#d4af37] flex items-center gap-3">
                                <Gem className="w-6 h-6" /> Part I: The Gamified Experience
                            </h2>

                            <div className="prose prose-invert prose-gold max-w-none text-[#a8a0b0]">
                                <h3 className="text-[#e2e8f0] font-cinzel text-xl mt-8">The Elemental Hierarchy</h3>
                                <p>
                                    Players interact with 18 unique elemental NFTs organized into three tiers, each representing increasing power
                                    and yield potential.
                                </p>

                                <div className="grid md:grid-cols-3 gap-6 my-8 not-prose">
                                    <div className="glass-panel p-6 border border-[#d4af37]/20 bg-[#0a0510]/50 rounded-xl">
                                        <h4 className="font-cinzel text-lg text-[#a8a0b0] mb-2">Lead Tier</h4>
                                        <p className="font-mono text-2xl text-[#e2e8f0] mb-4">100 Weight</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['Earth', 'Water', 'Wind', 'Fire', 'Ice', 'Lightning'].map(el => (
                                                <span key={el} className="px-2 py-1 rounded bg-[#d4af37]/10 text-[#d4af37] text-xs uppercase">{el}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="glass-panel p-6 border border-[#c0c0c0]/20 bg-[#0a0510]/50 rounded-xl">
                                        <h4 className="font-cinzel text-lg text-slate-300 mb-2">Silver Tier</h4>
                                        <p className="font-mono text-2xl text-[#e2e8f0] mb-4">135 Weight</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['Tsunami', 'Tornado', 'Inferno', 'Blizzard', 'Quake', 'Plasma'].map(el => (
                                                <span key={el} className="px-2 py-1 rounded bg-slate-400/10 text-slate-300 text-xs uppercase">{el}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="glass-panel p-6 border border-[#ffd700]/20 bg-[#0a0510]/50 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                                        <h4 className="font-cinzel text-lg text-[#ffd700] mb-2">Gold Tier</h4>
                                        <p className="font-mono text-2xl text-[#ffd700] mb-4">175 Weight</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['Holy', 'Dark', 'Gravity', 'Time', 'Bio', 'Spirit'].map(el => (
                                                <span key={el} className="px-2 py-1 rounded bg-[#ffd700]/10 text-[#ffd700] text-xs uppercase">{el}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-[#e2e8f0] font-cinzel text-xl mt-8">The Crafting Lab</h3>
                                <p>
                                    Alchemy Guild uses a <strong>recipe-based system</strong>. Unlike simple upgrades, players must strategically combine specific elements.
                                    Crafting requires burning exactly 3 NFTs and paying a small fee.
                                </p>
                                <ul className="list-disc pl-6 space-y-2 marker:text-[#d4af37]">
                                    <li><strong>Lead Synthesis (Tier 1 → 2):</strong> Burn 3 Tier 1 NFTs to craft a Silver Tier element.</li>
                                    <li><strong>Golden Ritual (Tier 2 → 3):</strong> Burn 2 Tier 2 NFTs + 1 Tier 1 NFT to craft a Gold Tier element.</li>
                                </ul>

                                <h3 className="text-[#e2e8f0] font-cinzel text-xl mt-8">The Vault (Staking)</h3>
                                <p>
                                    Staking represents the core economic engine. By committing your elements to the Vault, they begin accumulating <strong>GOLD</strong>.
                                </p>
                                <div className="bg-[#d4af37]/5 border-l-2 border-[#d4af37] p-4 my-4 italic">
                                    "Your share of the reward pool is strictly proportional to your Total Weight vs Global Weight."
                                </div>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent" />

                        {/* Part 2: Economy */}
                        <section className="space-y-8">
                            <h2 className="font-cinzel text-3xl text-[#d4af37] flex items-center gap-3">
                                <Clock className="w-6 h-6" /> Part II: Economic Model
                            </h2>

                            <div className="prose prose-invert prose-gold max-w-none text-[#a8a0b0]">
                                <h3 className="text-[#e2e8f0] font-cinzel text-xl mt-8">Revenue Streams</h3>
                                <p>
                                    The protocol generates value through three primary mechanisms:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 marker:text-[#d4af37]">
                                    <li><strong>Minting:</strong> Initial creation of elements.</li>
                                    <li><strong>Transmutation:</strong> Fees from crafting higher-tier elements.</li>
                                    <li><strong>Mana Pool (Uniswap V3):</strong> 0.3% fees earned from automated liquidity provision.</li>
                                </ul>

                                <h3 className="text-[#e2e8f0] font-cinzel text-xl mt-8">Deflationary Mechanics</h3>
                                <p>
                                    Every craft burns 3 NFTs to create 1. This creates permanent deflationary pressure on the supply, particularly for higher-tier elements.
                                    As players progress, the total number of Elementals reduces drastically, increasing scarcity.
                                </p>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent" />

                        {/* Part 3: Technical */}
                        <section className="space-y-8">
                            <h2 className="font-cinzel text-3xl text-[#d4af37] flex items-center gap-3">
                                <Zap className="w-6 h-6" /> Part III: Under The Hood
                            </h2>

                            <div className="prose prose-invert prose-gold max-w-none text-[#a8a0b0]">
                                <p>
                                    The protocol is built on a sophisticated set of smart contracts ensuring fair distribution and security.
                                </p>

                                <div className="grid md:grid-cols-2 gap-6 my-8 not-prose">
                                    <div className="p-4 bg-[#0a0510] border border-border rounded-lg">
                                        <h4 className="font-semibold text-[#e2e8f0] mb-2">YieldVault.sol</h4>
                                        <p className="text-sm">Handles staking logic, reward weight calculation, and fair distribution math using a reward debt algorithm.</p>
                                    </div>
                                    <div className="p-4 bg-[#0a0510] border border-border rounded-lg">
                                        <h4 className="font-semibold text-[#e2e8f0] mb-2">Alchemist.sol</h4>
                                        <p className="text-sm">Manages the burning and minting process, verifying recipes and enforcing deflationary rules.</p>
                                    </div>
                                </div>

                                <h3 className="text-[#e2e8f0] font-cinzel text-xl mt-8">Security & Fairness</h3>
                                <p>
                                    The <strong>Reward Debt</strong> system ensures users cannot claim rewards generated before they staked.
                                    Yield is distributed in O(1) time complexity, allowing the system to scale infinitely without increasing gas costs for distribution.
                                </p>
                            </div>
                        </section>

                        {/* Footer */}
                        <div className="pt-24 text-center">
                            <Link to="/dashboard" className="inline-flex items-center gap-2 px-8 py-3 bg-[#d4af37] text-black font-cinzel font-bold text-lg rounded-sm hover:bg-[#ffd700] transition-colors">
                                Launch the App <ArrowLeft className="rotate-180 w-5 h-5" />
                            </Link>
                        </div>

                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
