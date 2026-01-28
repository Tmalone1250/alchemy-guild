
import { DocsSidebarContent } from './DocsSidebarContent';

export function DocsSidebar() {
    return (
        <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border hidden md:flex flex-col">
            <DocsSidebarContent />
        </aside>
    );
}
