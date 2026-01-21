import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import Lab from "@/pages/Lab";
import Vault from "@/pages/Vault";
import Analytics from "@/pages/Analytics";
import LandingPage from "@/pages/LandingPage";
import NotFound from "@/pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'hsl(220, 14%, 7%)',
          border: '1px solid hsl(220, 14%, 16%)',
          color: 'hsl(210, 20%, 95%)',
        },
      }}
    />
    <BrowserRouter>
      <Routes>
        {/* Landing Page - Root */}
        <Route path="/" element={<LandingPage />} />

        {/* App Routes - With Dashboard Layout */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/lab" element={<Lab />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
