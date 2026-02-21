import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileSearch,
  Coins,
  Key,
  Receipt,
  User,
  Shield,
  Users,
  BookOpen,
  LogOut,
  ChevronUp,
} from "lucide-react";
import solarizerLogo from "@/assets/solarizer-logo.png";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Profile {
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

const navGroups = [
  {
    label: "OVERVIEW",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, end: true },
      { title: "Analyses", url: "/dashboard/analyses", icon: FileSearch },
      { title: "Credit Activity", url: "/dashboard/credits", icon: Coins },
    ],
  },
  {
    label: "MANAGE",
    items: [
      { title: "API Keys", url: "/dashboard/api-keys", icon: Key },
      { title: "Sharing", url: "/dashboard/sharing", icon: Users },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { title: "Profile", url: "/dashboard/profile", icon: User },
      { title: "Security", url: "/dashboard/security", icon: Shield },
      { title: "Billing", url: "/dashboard/billing", icon: Receipt },
    ],
  },
];

export function DashboardSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, email, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [user]);

  const getInitials = () => {
    if (profile?.display_name)
      return profile.display_name.slice(0, 2).toUpperCase();
    if (profile?.email) return profile.email.slice(0, 2).toUpperCase();
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return "U";
  };

  const handleNavClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Logo */}
      <SidebarHeader className="p-4">
        <button
          onClick={() => { navigate("/dashboard"); handleNavClick(); }}
          className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center"
        >
          <img
            src={solarizerLogo}
            alt="Solarizer"
            className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
          />
          <span className="text-sm font-semibold text-foreground group-data-[collapsible=icon]:hidden">
            Solarizer
          </span>
        </button>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Nav Groups */}
      <SidebarContent className="px-1">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold px-3">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        end={item.end}
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
        ))}

        {/* Docs Link */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Documentation">
                    <NavLink
                      to="/dashboard/docs"
                      onClick={handleNavClick}
                    className="text-muted-foreground/70 hover:text-foreground hover:bg-sidebar-accent transition-colors"
                    activeClassName="bg-primary/10 text-foreground font-medium"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Documentation</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Footer */}
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="w-full hover:bg-sidebar-accent"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-medium text-primary">
                      {getInitials()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium text-foreground truncate">
                      {profile?.display_name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {profile?.email || user?.email}
                    </p>
                  </div>
                  <ChevronUp className="w-4 h-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-56"
              >
                <DropdownMenuItem onClick={() => { navigate("/dashboard/profile"); handleNavClick(); }}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
