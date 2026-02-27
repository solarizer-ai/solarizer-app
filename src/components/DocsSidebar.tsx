import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  BookOpen,
  Shield,
  Terminal,
  HelpCircle,
  ArrowLeft,
  FileSearch,
  Coins,
} from "lucide-react";
import solarizerLogo from "@/assets/solarizer-logo.png";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Setup", url: "/docs/setup", icon: BookOpen },
  { title: "Audits", url: "/docs/audits", icon: FileSearch },
  { title: "Grades", url: "/docs/grades", icon: Shield },
  { title: "Plans & Costing", url: "/docs/plans-and-costing", icon: Coins },
  { title: "Reference", url: "/docs/reference", icon: Terminal },
  { title: "FAQ", url: "/docs/faq", icon: HelpCircle },
];

export function DocsSidebar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setOpenMobile } = useSidebar();

  const handleNavClick = () => setOpenMobile(false);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <button
          onClick={() => { navigate("/"); handleNavClick(); }}
          className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center"
        >
          <img
            src={solarizerLogo}
            alt="Solarizer"
            className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
            decoding="sync"
          />
          <span className="text-sm font-semibold text-foreground group-data-[collapsible=icon]:hidden">
            Solarizer
          </span>
        </button>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-1">
        {user && (
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Back to Dashboard">
                      <NavLink
                        to="/dashboard"
                        onClick={handleNavClick}
                        className="text-muted-foreground/70 hover:text-foreground hover:bg-sidebar-accent transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Dashboard</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />
          </>
        )}

        {/* Doc sections */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold px-3">
            DOCUMENTATION
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      onClick={handleNavClick}
                      className="text-muted-foreground/70 hover:text-foreground hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-primary/10 text-foreground font-medium border-l-2 border-l-primary"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
