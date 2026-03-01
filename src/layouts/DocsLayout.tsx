import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DocsSidebar } from "@/components/DocsSidebar";

export default function DocsLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DocsSidebar />
        <main className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10 flex items-center h-12 px-4 bg-background/80 backdrop-blur-sm border-b border-border md:hidden">
            <SidebarTrigger />
          </div>
          <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
