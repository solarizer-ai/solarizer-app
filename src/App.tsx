import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import DocsLayout from "@/layouts/DocsLayout";
import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ComingSoon from "./pages/ComingSoon";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import PaymentSuccess from "./pages/PaymentSuccess";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import Report from "./pages/Report";

// Dashboard pages
import DashboardHome from "./pages/dashboard/DashboardHome";
import AnalysesPage from "./pages/dashboard/AnalysesPage";
import CreditActivityPage from "./pages/dashboard/CreditActivityPage";
import ApiKeysPage from "./pages/dashboard/ApiKeysPage";
import BillingPage from "./pages/dashboard/BillingPage";
import ProfilePage from "./pages/dashboard/ProfilePage";
import SecurityPage from "./pages/dashboard/SecurityPage";
import SharingPage from "./pages/dashboard/SharingPage";

// Docs pages
import SetupPage from "./pages/docs/SetupPage";
import AuditsDocsPage from "./pages/docs/AuditsPage";
import GradesPage from "./pages/docs/GradesPage";
import ReferencePage from "./pages/docs/ReferencePage";
import FaqPage from "./pages/docs/FaqPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/signup" element={<Auth />} />
              <Route path="/coming-soon" element={<ComingSoon />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
              <Route path="/subscription-success" element={<ProtectedRoute><SubscriptionSuccess /></ProtectedRoute>} />

              {/* Docs (sidebar layout, public) */}
              <Route path="/docs" element={<DocsLayout />}>
                <Route index element={<Navigate to="/docs/setup" replace />} />
                <Route path="setup" element={<SetupPage />} />
                <Route path="audits" element={<AuditsDocsPage />} />
                <Route path="grades" element={<GradesPage />} />
                <Route path="reference" element={<ReferencePage />} />
                <Route path="faq" element={<FaqPage />} />
              </Route>

              {/* Dashboard (sidebar layout) */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<DashboardHome />} />
                <Route path="analyses" element={<AnalysesPage />} />
                <Route path="credits" element={<CreditActivityPage />} />
                <Route path="api-keys" element={<ApiKeysPage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="security" element={<SecurityPage />} />
                <Route path="sharing" element={<SharingPage />} />
                <Route path="docs" element={<Navigate to="/docs/setup" replace />} />
                <Route path="subscription" element={<Navigate to="/dashboard/billing" replace />} />
              </Route>

              {/* Report stays standalone (full-width) */}
              <Route path="/reports/:auditId" element={<ProtectedRoute><Report /></ProtectedRoute>} />

              {/* Legacy redirects */}
              <Route path="/settings" element={<Navigate to="/dashboard/profile" replace />} />
              <Route path="/audits" element={<Navigate to="/dashboard/analyses" replace />} />
              <Route path="/billing" element={<Navigate to="/dashboard/billing" replace />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
