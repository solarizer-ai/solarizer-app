import { Link } from "react-router-dom";
import solarizerLogo from "@/assets/solarizer-logo.png";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="container mx-auto px-6 py-6">
        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          {/* Left: Logo + Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" onClick={scrollToTop}>
              <img src={solarizerLogo} alt="Solarizer" className="w-8 h-8 rounded-lg" />
            </Link>
            <span className="text-sm font-medium text-foreground">Solarizer</span>
          </div>

          {/* Right: Links */}
          <div className="flex items-start gap-10">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground/50">Product</span>
              <Link to="/pricing" onClick={scrollToTop} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
              <Link to="/docs" onClick={scrollToTop} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
              <Link to="/dashboard" onClick={scrollToTop} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground/50">Legal</span>
              <Link to="/privacy" onClick={scrollToTop} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" onClick={scrollToTop} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
            </div>
          </div>
        </div>

        {/* Desktop Bottom Row */}
        <div className="hidden sm:flex items-center justify-between mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            © 2026 Eryonix Techlabs. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/50">
            Enterprise-grade smart contract security. For everyone.
          </p>
        </div>

        {/* Mobile Layout - Centered */}
        <div className="sm:hidden flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-3">
            <Link to="/" onClick={scrollToTop}>
              <img src={solarizerLogo} alt="Solarizer" className="w-8 h-8 rounded-lg" />
            </Link>
            <span className="text-sm font-medium text-foreground">Solarizer</span>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Link to="/pricing" onClick={scrollToTop} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/docs" onClick={scrollToTop} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
            <Link to="/privacy" onClick={scrollToTop} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" onClick={scrollToTop} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
          </div>

          <p className="text-xs text-muted-foreground">
            © 2026 Eryonix Techlabs
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
