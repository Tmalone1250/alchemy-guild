
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent as ShadcnSheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SidebarContent } from './SidebarContent';
import { Hexagon } from 'lucide-react';
import { useState } from 'react';

export function MobileNav() {
    const [open, setOpen] = useState(false);

    return (
        <div className="md:hidden flex items-center justify-between p-4 border-b border-sidebar-border bg-sidebar z-20 relative">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Hexagon className="w-8 h-8 text-primary fill-primary/10" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse-gold" />
                    </div>
                </div>
                <span className="font-semibold text-foreground">Alchemy Guild</span>
            </div>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                        <Menu className="w-6 h-6" />
                    </Button>
                </SheetTrigger>
                <ShadcnSheetContent side="left" className="p-0 bg-sidebar border-r border-sidebar-border w-72">
                    <SidebarContent onNavClick={() => setOpen(false)} />
                </ShadcnSheetContent>
            </Sheet>
        </div>
    );
}
