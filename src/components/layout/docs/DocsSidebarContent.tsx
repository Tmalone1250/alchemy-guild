
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Book,
    Gamepad2,
    Coins,
    Code2,
    Scroll,
    ArrowLeft,
    Hexagon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
    { path: '/docs', label: 'Introduction', icon: Book, end: true },
    { path: '/docs/gameplay', label: 'Gameplay', icon: Gamepad2 },
    { path: '/docs/staking', label: 'Staking & Vault', icon: Scroll },
    { path: '/docs/economics', label: 'Economics', icon: Coins },
    { path: '/docs/technical', label: 'Technical', icon: Code2 },
];

interface DocsSidebarContentProps {
    onNavClick?: () => void;
}

export function DocsSidebarContent({ onNavClick }: DocsSidebarContentProps) {
    const location = useLocation();

    return (
        <div className="flex flex-col h-full">
            {/* Logo Area */}
            <div className="p-6 border-b border-sidebar-border">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Hexagon className="w-10 h-10 text-primary fill-primary/10" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Book className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-foreground">Docs</h1>
                        <p className="text-xs text-muted-foreground">Alchemy Guild</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    // Handle 'end' prop for exact matching on home link
                    const isActive = item.end
                        ? location.pathname === item.path
                        : location.pathname.startsWith(item.path);

                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            onClick={onNavClick}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                                'hover:bg-sidebar-accent group relative',
                                isActive
                                    ? 'bg-sidebar-accent text-primary'
                                    : 'text-sidebar-foreground hover:text-sidebar-accent-foreground'
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId={onNavClick ? "activeDocsNavMobile" : "activeDocsNav"}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}
                            <Icon className={cn('w-5 h-5 transition-colors', isActive && 'text-primary')} />
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer / Back Link */}
            <div className="p-4 border-t border-sidebar-border mt-auto">
                <NavLink to="/dashboard">
                    <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4" />
                        Back to App
                    </Button>
                </NavLink>
            </div>
        </div>
    );
}
