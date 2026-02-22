import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, ChevronRight } from "lucide-react";
import solarizerLogo from "@/assets/solarizer-logo.png";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Profile {
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

const Header = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/pricing", label: "Pricing" },
    { href: "/docs", label: "Docs" },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, email, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [user]);

  const getInitials = () => {
    if (profile?.display_name) return profile.display_name.slice(0, 2).toUpperCase();
    if (profile?.email) return profile.email.slice(0, 2).toUpperCase();
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return 'U';
  };

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    if (href === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Floating glass pill header */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] max-w-2xl w-[calc(100%-2rem)]">
        <div className="rounded-2xl bg-black/70 backdrop-blur-2xl border border-primary/40 shadow-[0_0_30px_rgba(0,0,0,0.3)] px-6 h-14 flex items-center justify-between">
          {/* Left: Logo + Brand */}
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <img src={solarizerLogo} alt="Solarizer" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-sm font-medium text-foreground hidden sm:inline">Solarizer</span>
          </Link>

          {/* Center: Nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-[13px] transition-colors",
                  isActive(link.href)
                    ? "font-medium text-foreground"
                    : "text-muted-foreground/60 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">

            {/* Desktop auth */}
            <div className="hidden md:flex items-center gap-2">
              {!loading && (
                user ? (
                  <button
                    onClick={() => navigate("/settings")}
                    className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center hover:bg-primary/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <span className="text-[10px] font-medium text-primary">{getInitials()}</span>
                  </button>
                ) : (
                  <Link
                    to="/signup"
                    className="rounded-full bg-primary text-primary-foreground text-xs px-4 py-1.5 font-medium hover:bg-primary/90 transition-colors"
                  >
                    Get Started
                  </Link>
                )
              )}
            </div>

            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:text-foreground h-8 w-8">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-background border-border">
                <div className="flex flex-col h-full py-6">
                  {user && (
                    <button
                      onClick={() => { navigate("/settings"); setMobileMenuOpen(false); }}
                      className="flex items-center gap-3 px-2 mb-6 w-full hover:bg-muted rounded-lg py-2 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">{getInitials()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{profile?.display_name || 'User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{profile?.email || user?.email}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}

                  <nav className="flex flex-col gap-1">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "px-3 py-2.5 rounded-lg text-sm transition-colors",
                          isActive(link.href)
                            ? "bg-primary/10 text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>

                  {!loading && !user && (
                    <div className="flex flex-col gap-2 pt-4 mt-auto border-t border-border">
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                      </Button>
                      <Button asChild variant="solarGlow" className="w-full">
                        <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

    </>
  );
};

export default Header;
