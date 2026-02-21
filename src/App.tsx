import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import Docs from "./pages/Docs";
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
import UsagePage from "./pages/dashboard/UsagePage";
import CreditActivityPage from "./pages/dashboard/CreditActivityPage";
import ApiKeysPage from "./pages/dashboard/ApiKeysPage";
import IntegrationsPage from "./pages/dashboard/IntegrationsPage";
import BillingPage from "./pages/dashboard/BillingPage";
import ProfilePage from "./pages/dashboard/ProfilePage";
import SecurityPage from "./pages/dashboard/SecurityPage";
import SubscriptionPage from "./pages/dashboard/SubscriptionPage";
import SharingPage from "./pages/dashboard/SharingPage";

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
              <Route path="/docs" element={<Docs />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
              <Route path="/subscription-success" element={<ProtectedRoute><SubscriptionSuccess /></ProtectedRoute>} />

              {/* Dashboard (sidebar layout) */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<DashboardHome />} />
                <Route path="analyses" element={<AnalysesPage />} />
                <Route path="usage" element={<UsagePage />} />
                <Route path="credits" element={<CreditActivityPage />} />
                <Route path="api-keys" element={<ApiKeysPage />} />
                <Route path="integrations" element={<IntegrationsPage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="security" element={<SecurityPage />} />
                <Route path="subscription" element={<SubscriptionPage />} />
                <Route path="sharing" element={<SharingPage />} />
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
