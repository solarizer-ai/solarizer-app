import { Link } from "react-router-dom";

const MinimalFooter = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Solarizer
        </p>
        <p className="text-xs text-muted-foreground hidden sm:block">
          Powering secure deployments worldwide
        </p>
        <div className="flex items-center gap-4">
          <Link 
            to="/privacy" 
            onClick={scrollToTop}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <Link 
            to="/terms" 
            onClick={scrollToTop}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default MinimalFooter;
