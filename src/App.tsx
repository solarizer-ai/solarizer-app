import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import solarizerLogo from "@/assets/solarizer-logo.png";
import { ThemeProvider } from "@/hooks/useTheme";
import { ScanProvider } from "@/contexts/ScanContext";
import ScrollToTop from "@/components/ScrollToTop";
import ComingSoon from "./pages/ComingSoon";
import Auth from "./pages/Auth";
import PublicReport from "./pages/PublicReport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <ScanProvider>
            <Toaster />
            <Sonner />
            {/* Persistent hidden logo keeps decoded bitmap in memory across route changes */}
            <img src={solarizerLogo} alt="" aria-hidden className="hidden" decoding="sync" />
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                {/* Coming Soon landing */}
                <Route path="/" element={<ComingSoon />} />

                {/* Auth still accessible */}
                <Route path="/login" element={<Auth />} />
                <Route path="/signup" element={<Auth />} />

                {/* Public audit reports still work */}
                <Route path="/report/:slug" element={<PublicReport />} />

                {/* Everything else redirects to Coming Soon */}
                <Route path="/dashboard/*" element={<Navigate to="/" replace />} />
                <Route path="/pricing" element={<Navigate to="/" replace />} />
                <Route path="/docs/*" element={<Navigate to="/" replace />} />
                <Route path="/privacy" element={<Navigate to="/" replace />} />
                <Route path="/terms" element={<Navigate to="/" replace />} />
                <Route path="/coming-soon" element={<Navigate to="/" replace />} />
                <Route path="/payment-success" element={<Navigate to="/" replace />} />
                <Route path="/activate-trial" element={<Navigate to="/" replace />} />
                <Route path="/subscription-success" element={<Navigate to="/" replace />} />
                <Route path="/settings" element={<Navigate to="/" replace />} />
                <Route path="/audits" element={<Navigate to="/" replace />} />
                <Route path="/billing" element={<Navigate to="/" replace />} />
                <Route path="/reports/:auditId" element={<Navigate to="/" replace />} />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ScanProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
