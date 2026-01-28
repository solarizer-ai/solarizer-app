import { Link } from "react-router-dom";
import solarizerLogo from "@/assets/solarizer-logo.png";

const footerLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Docs", href: "/docs" },
];

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
          <div className="flex items-center gap-6">
            {footerLinks.map((link, index) => (
              <div key={link.label} className="flex items-center gap-6">
                <Link
                  to={link.href}
                  onClick={scrollToTop}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Bottom Row */}
        <div className="hidden sm:flex items-center justify-between mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ERYONIX TECHLABS PRIVATE LIMITED
          </p>
          <p className="text-xs text-muted-foreground">
            Powering secure deployments worldwide
          </p>
        </div>

        {/* Mobile Layout */}
        <div className="sm:hidden space-y-4">
          {/* Logo + Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" onClick={scrollToTop}>
              <img src={solarizerLogo} alt="Solarizer" className="w-8 h-8 rounded-lg" />
            </Link>
            <span className="text-sm font-medium text-foreground">Solarizer</span>
          </div>

          {/* Links Row */}
          <div className="flex items-center gap-4">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={scrollToTop}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ERYONIX TECHLABS
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
