
import { Outlet } from 'react-router-dom';
import { DocsSidebar } from './DocsSidebar';
import { MobileDocsNav } from './MobileDocsNav';
import { AnimatedBackground } from '../AnimatedBackground';

export function DocsLayout() {
    return (
        <div className="flex min-h-screen w-full bg-[#050308] flex-col md:flex-row">
            <DocsSidebar />
            <MobileDocsNav />
            <div className="relative flex-1 flex flex-col h-screen overflow-hidden">
                <AnimatedBackground />
                <main className="flex-1 overflow-auto relative z-10 p-8 lg:p-12 max-w-4xl mx-auto w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
