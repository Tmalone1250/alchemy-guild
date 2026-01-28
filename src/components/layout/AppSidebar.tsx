
import { SidebarContent } from './SidebarContent';

export function AppSidebar() {
  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border hidden md:flex flex-col">
      <SidebarContent />
    </aside>
  );
}
