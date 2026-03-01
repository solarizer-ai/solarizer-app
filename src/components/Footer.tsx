import { Link } from "react-router-dom";
import { Twitter } from "lucide-react";
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
            <a
              href="mailto:hello@solarizer.io"
              className="text-xs text-muted-foreground/40 hover:text-primary transition-colors font-mono"
            >
              hello@solarizer.io
            </a>
            <a
              href="https://x.com/solarizer_io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/40 hover:text-primary transition-colors"
            >
              <Twitter className="w-3.5 h-3.5" />
              <span className="font-mono">@solarizer_io</span>
            </a>
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
