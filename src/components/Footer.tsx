import { Link } from "react-router-dom";

const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="mt-auto py-8">
      <div className="container mx-auto px-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted-foreground/40">
        <span>© 2026 Eryonix Techlabs</span>
        <span>·</span>
        <Link to="/pricing" onClick={scrollToTop} className="hover:text-muted-foreground transition-colors">Pricing</Link>
        <span>·</span>
        <Link to="/docs" onClick={scrollToTop} className="hover:text-muted-foreground transition-colors">Docs</Link>
        <span>·</span>
        <Link to="/privacy" onClick={scrollToTop} className="hover:text-muted-foreground transition-colors">Privacy</Link>
        <span>·</span>
        <Link to="/terms" onClick={scrollToTop} className="hover:text-muted-foreground transition-colors">Terms</Link>
      </div>
    </footer>
  );
};

export default Footer;
