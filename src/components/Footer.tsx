import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import solarizerLogo from "@/assets/solarizer-logo.png";

const footerLinks = {
  Product: [
    { label: "Pricing", to: "/pricing" },
    { label: "Start Auditing", to: "/login" },
  ],
  Resources: [
    { label: "Setup Guide", to: "/docs/setup" },
    { label: "Audits", to: "/docs/audits" },
    { label: "Grades", to: "/docs/grades" },
    { label: "FAQ", to: "/docs/faq" },
    { label: "Plans & Costing", to: "/docs/plans-and-costing" },
  ],
  Legal: [
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms of Service", to: "/terms" },
  ],
} as const;

const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="mt-auto border-t border-border/10">
      <div className="max-w-5xl mx-auto px-6 pt-12 pb-8">
        {/* Main grid — desktop: 4 cols, mobile: stacked */}
        <div className="grid md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-8">
          {/* Brand block */}
          <div className="space-y-4">
            <Link to="/" onClick={scrollToTop} className="flex items-center gap-2.5">
              <img src={solarizerLogo} alt="Solarizer" className="w-7 h-7 rounded-lg" decoding="sync" />
              <span className="text-sm font-semibold tracking-tight text-gradient">Solarizer</span>
            </Link>
            <p className="text-sm text-muted-foreground/50 max-w-[220px] leading-relaxed">
              AI-powered smart contract security analysis
            </p>
            <div className="flex items-center gap-3">
              <a
                href="mailto:hello@solarizer.io"
                className="text-muted-foreground/40 hover:text-primary transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="https://x.com/solarizer_io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground/40 hover:text-primary transition-colors"
                aria-label="X (Twitter)"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://t.me/solarizer_ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground/40 hover:text-primary transition-colors"
                aria-label="Telegram"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns — mobile: 3-col row; desktop: inline with brand */}
          <div className="col-span-1 md:contents grid grid-cols-3 gap-6">
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading}>
                <h4 className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-3">
                  {heading}
                </h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        onClick={scrollToTop}
                        className="text-sm text-muted-foreground/50 hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border/10">
          <p className="text-xs text-muted-foreground/30">© 2026 Solarizer</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
