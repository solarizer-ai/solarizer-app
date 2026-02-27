import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import solarizerLogo from "@/assets/solarizer-logo.png";

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10 flex items-center gap-3 h-11 px-4 bg-background/80 backdrop-blur-sm border-b border-border">
            <SidebarTrigger />
            <img src={solarizerLogo} alt="Solarizer" className="h-5 w-auto md:hidden" />
          </div>
          <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
