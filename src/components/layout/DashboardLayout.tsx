import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { MobileNav } from './MobileNav';
import { AnimatedBackground } from './AnimatedBackground';

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen w-full bg-[#050308] flex-col md:flex-row">
      <AppSidebar />
      <MobileNav />
      <div className="relative flex-1 flex flex-col h-screen overflow-hidden">
        <AnimatedBackground />
        <main className="flex-1 overflow-auto relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
