
import { Menu, Hexagon, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DocsSidebarContent } from './DocsSidebarContent';
import { useState } from 'react';

export function MobileDocsNav() {
    const [open, setOpen] = useState(false);

    return (
        <div className="md:hidden flex items-center justify-between p-4 border-b border-sidebar-border bg-sidebar z-20 relative">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Hexagon className="w-8 h-8 text-primary fill-primary/10" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Book className="w-4 h-4 text-primary" />
                    </div>
                </div>
                <span className="font-semibold text-foreground">Docs</span>
            </div>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                        <Menu className="w-6 h-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 bg-sidebar border-r border-sidebar-border w-72">
                    <DocsSidebarContent onNavClick={() => setOpen(false)} />
                </SheetContent>
            </Sheet>
        </div>
    );
}
