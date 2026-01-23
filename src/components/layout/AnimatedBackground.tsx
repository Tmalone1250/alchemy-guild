import React, { useState, useEffect, useMemo } from 'react';

// Alchemical Symbol SVG Paths  
const SYMBOLS = {
    earth: "M12 21 L2 4 L22 4 Z M2 8 L22 8",
    air: "M12 3 L22 20 L2 20 Z M2 10 L22 10",
    fire: "M12 2 L22 19 L2 19 Z",
    water: "M12 22 L2 5 L22 5 Z",
    mercury: "M12 8 a 4 4 0 1 0 0 8 a 4 4 0 1 0 0 -8 M12 8 L12 4 M8 4 a 4 4 0 0 1 8 0 M12 16 L12 22 M8 19 L16 19",
    gold: "M12 12 m-5 0 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0 M12 22 L12 22",
};

const RUNES = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ", "ᛇ", "ᛈ", "ᛉ", "ᛊ", "ᛏ", "ᛒ", "ᛖ", "ᛗ", "ᛚ", "ᛜ", "ᛞ", "ᛟ"];

export const AnimatedBackground = ({ isActive = false }: { isActive?: boolean }) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Parallax Effect
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const { innerWidth, innerHeight } = window;
            setMousePos({
                x: (e.clientX - innerWidth / 2) / innerWidth,
                y: (e.clientY - innerHeight / 2) / innerHeight,
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Import Cinematic Font */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lato:wght@300;400&display=swap');
                .font-cinzel { font-family: 'Cinzel', serif; }
                .font-lato { font-family: 'Lato', sans-serif; }
            `}</style>

            {/* 1. Deep Void */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1025_0%,_#050308_80%)]" />

            {/* 2. Noise Texture */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            {/* 3. The Mystical Circle (Centered behind content) */}
            <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-300 will-change-transform"
                style={{ transform: `translate(${mousePos.x * -30}px, ${mousePos.y * -30}px)` }}
            >
                <div className={`relative w-[600px] h-[600px] md:w-[900px] md:h-[900px] transition-all duration-1000 ease-in-out ${isActive ? 'scale-110 brightness-125' : 'scale-100 opacity-40'}`}>
                    <TransmutationCircle isActive={isActive} />
                </div>
            </div>

            {/* 4. Particles */}
            <Particles count={40} mousePos={mousePos} />
        </div>
    );
};

const TransmutationCircle = ({ isActive }: { isActive: boolean }) => {
    return (
        <div className={`relative w-full h-full flex items-center justify-center transition-all duration-1000 ${isActive ? 'brightness-125' : ''}`}>

            {/* Outer Rune Ring */}
            <div className={`absolute inset-0 ${isActive ? 'animate-[spin_20s_linear_infinite]' : 'animate-[spin_60s_linear_infinite]'}`}>
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible opacity-30">
                    <path id="runePath" d="M 50, 50 m -48, 0 a 48,48 0 1,1 96,0 a 48,48 0 1,1 -96,0" fill="none" />
                    <text fontSize="3" fill="#8b7355" letterSpacing="4.5" fontWeight="bold">
                        <textPath href="#runePath" startOffset="0%">
                            {RUNES.join(" ")} • {RUNES.join(" ")} • {RUNES.join(" ")} • {RUNES.join(" ")}
                        </textPath>
                    </text>
                </svg>
            </div>

            {/* Geometric Hexagram */}
            <div className={`absolute w-[75%] h-[75%] border border-[#8b7355]/20 rounded-full flex items-center justify-center ${isActive ? 'animate-[spin_15s_linear_infinite_reverse]' : 'animate-[spin_45s_linear_infinite_reverse]'}`}>
                <div className="absolute w-full h-full opacity-40">
                    <svg viewBox="0 0 100 100" className="w-full h-full p-2 stroke-[#d4af37] stroke-[0.2] fill-none">
                        <polygon points="50,5 90,80 10,80" />
                        <polygon points="50,95 90,20 10,20" />
                        <circle cx="50" cy="50" r="48" className="stroke-[0.3]" />
                        <circle cx="50" cy="50" r="30" className="stroke-[0.1]" />
                    </svg>
                </div>
            </div>

            {/* Elemental Symbols */}
            <div className={`absolute w-[55%] h-[55%] ${isActive ? 'animate-[spin_10s_linear_infinite]' : 'animate-[spin_30s_linear_infinite]'}`}>
                {[0, 90, 180, 270].map((deg, i) => {
                    const symbols = ['fire', 'water', 'air', 'earth'];
                    return (
                        <div
                            key={i}
                            className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-[#050308] border border-[#8b7355] shadow-[0_0_10px_rgba(212,175,55,0.2)] transition-colors duration-500 ${isActive ? 'bg-[#2a1b3d] border-[#ffd700]' : ''}`}
                            style={{ transform: `rotate(${deg}deg) translateY(-120px) rotate(-${deg}deg)` }}
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-current text-[#d4af37]">
                                <path d={SYMBOLS[symbols[i] as keyof typeof SYMBOLS]} strokeWidth="1" />
                            </svg>
                        </div>
                    )
                })}
            </div>

            {/* Core Symbol */}
            <div className="absolute z-10 w-24 h-24 flex items-center justify-center">
                <div className={`absolute inset-0 bg-[#d4af37] rounded-full blur-[30px] transition-all duration-500 ${isActive ? 'scale-150 opacity-60' : 'scale-50 opacity-10'}`} />
                <div className="relative w-full h-full bg-[#050308] border border-[#d4af37] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                    {/* Show Mercury when idle, Gold when active */}
                    <svg
                        viewBox="0 0 24 24"
                        className={`absolute w-10 h-10 stroke-[#d4af37] fill-none stroke-[0.5] transition-all duration-700 ${isActive ? 'opacity-0 rotate-180 scale-50' : 'opacity-100 rotate-0 scale-100'}`}
                    >
                        <path d={SYMBOLS.mercury} />
                    </svg>

                    <svg
                        viewBox="0 0 24 24"
                        className={`absolute w-12 h-12 stroke-[#ffd700] fill-[#ffd700] transition-all duration-700 ${isActive ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-50'}`}
                        style={{ filter: 'drop-shadow(0 0 5px #ffd700)' }}
                    >
                        <path d={SYMBOLS.gold} />
                    </svg>
                </div>
            </div>
        </div>
    );
};

const Particles = ({ count, mousePos }: { count: number; mousePos: { x: number; y: number } }) => {
    const particles = useMemo(() => {
        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 15 + 10,
            delay: Math.random() * 5,
            opacity: Math.random() * 0.4 + 0.1
        }));
    }, [count]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute rounded-full bg-[#d4af37] blur-[1px]"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        opacity: p.opacity,
                        animation: `float ${p.duration}s ease-in-out infinite`,
                        animationDelay: `${p.delay}s`,
                        transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`
                    }}
                />
            ))}
            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.1; }
          50% { transform: translateY(-40px) translateX(20px); opacity: 0.5; }
        }
      `}</style>
        </div>
    );
};
