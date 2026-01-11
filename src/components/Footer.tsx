import { Link } from "react-router-dom";
import solarizerLogo from "@/assets/solarizer-logo.png";

const footerLinks = {
  product: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Dashboard", href: "/audits" },
  ],
  intelligence: [
    { label: "Documentation", href: "/docs" },
    { label: "Security Index", href: "/docs" },
    { label: "Exploit Database", href: "/docs" },
  ],
  legal: [
    { label: "Privacy", href: "/coming-soon" },
    { label: "Terms", href: "/coming-soon" },
    { label: "Security", href: "/coming-soon" },
  ],
};

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <img src={solarizerLogo} alt="Solarizer" className="w-10 h-10 rounded-lg" />
            </Link>
            <p className="text-sm text-muted-foreground">
              Proprietary smart contract security intelligence.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-medium mb-3 text-sm">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Intelligence Links */}
          <div>
            <h4 className="font-medium mb-3 text-sm">Intelligence</h4>
            <ul className="space-y-2">
              {footerLinks.intelligence.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-medium mb-3 text-sm">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Solarizer. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Powering secure deployments worldwide
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;