import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import solarizerLogo from "@/assets/solarizer-logo.png";
import { ThemeProvider } from "@/hooks/useTheme";
import { ScanProvider } from "@/contexts/ScanContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
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
import Report from "./pages/Report";
import PublicReport from "./pages/PublicReport";
import ActivateTrial from "./pages/ActivateTrial";

// Dashboard pages
import DashboardHome from "./pages/dashboard/DashboardHome";
import AnalysesPage from "./pages/dashboard/AnalysesPage";
import ApiKeysPage from "./pages/dashboard/ApiKeysPage";
import BillingPage from "./pages/dashboard/BillingPage";
import ProfilePage from "./pages/dashboard/ProfilePage";
import SecurityPage from "./pages/dashboard/SecurityPage";
import SharingPage from "./pages/dashboard/SharingPage";
import IntegrationsPage from "./pages/dashboard/IntegrationsPage";
import NewAuditPage from "./pages/dashboard/NewAuditPage";
import SupportPage from "./pages/dashboard/SupportPage";

// Admin pages
import { AdminRoute } from "./components/AdminRoute";
import AdminOverviewPage from "./pages/dashboard/admin/AdminOverviewPage";
import AdminUsersPage from "./pages/dashboard/admin/AdminUsersPage";
import AdminUserDetailPage from "./pages/dashboard/admin/AdminUserDetailPage";
import AdminAuditsPage from "./pages/dashboard/admin/AdminAuditsPage";
import AdminAuditDetailPage from "./pages/dashboard/admin/AdminAuditDetailPage";
import AdminCouponsPage from "./pages/dashboard/admin/AdminCouponsPage";
import AdminCreditsPage from "./pages/dashboard/admin/AdminCreditsPage";
import AdminAccessTokensPage from "./pages/dashboard/admin/AdminAccessTokensPage";

// Docs pages
import SetupPage from "./pages/docs/SetupPage";
import AuditsDocsPage from "./pages/docs/AuditsPage";
import GradesPage from "./pages/docs/GradesPage";
import ReferencePage from "./pages/docs/ReferencePage";
import FaqPage from "./pages/docs/FaqPage";
import PlansAndCostingPage from "./pages/docs/PlansAndCostingPage";

const ReportRedirect = () => {
  const { auditId } = useParams();
  return <Navigate to={`/dashboard/reports/${auditId}`} replace />;
};

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
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/signup" element={<Auth />} />
                <Route path="/coming-soon" element={<ComingSoon />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
                <Route path="/subscription-success" element={<Navigate to="/pricing" replace />} />

                {/* Docs (sidebar layout, public) */}
                <Route path="/docs" element={<DocsLayout />}>
                  <Route index element={<Navigate to="/docs/setup" replace />} />
                  <Route path="setup" element={<SetupPage />} />
                  <Route path="audits" element={<AuditsDocsPage />} />
                  <Route path="grades" element={<GradesPage />} />
                  <Route path="reference" element={<ReferencePage />} />
                  <Route path="faq" element={<FaqPage />} />
                  <Route path="plans-and-costing" element={<PlansAndCostingPage />} />
                </Route>

                {/* Dashboard (sidebar layout) */}
                <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                  <Route index element={<DashboardHome />} />
                  <Route path="analyses" element={<AnalysesPage />} />
                  <Route path="credits" element={<Navigate to="/dashboard/billing?tab=activity" replace />} />
                   {/* API Keys hidden until CLI release */}
                   {/* <Route path="api-keys" element={<ApiKeysPage />} /> */}
                  <Route path="billing" element={<BillingPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="security" element={<SecurityPage />} />
                  <Route path="sharing" element={<SharingPage />} />
                  <Route path="integrations" element={<IntegrationsPage />} />
                  <Route path="new-audit" element={<NewAuditPage />} />
                  <Route path="support" element={<SupportPage />} />
                  <Route path="admin" element={<AdminRoute><AdminOverviewPage /></AdminRoute>} />
                  <Route path="admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
                  <Route path="admin/users/:id" element={<AdminRoute><AdminUserDetailPage /></AdminRoute>} />
                  <Route path="admin/audits" element={<AdminRoute><AdminAuditsPage /></AdminRoute>} />
                  <Route path="admin/audits/:id" element={<AdminRoute><AdminAuditDetailPage /></AdminRoute>} />
                  <Route path="admin/coupons" element={<AdminRoute><AdminCouponsPage /></AdminRoute>} />
                  <Route path="admin/credits" element={<AdminRoute><AdminCreditsPage /></AdminRoute>} />
                  <Route path="admin/access-tokens" element={<AdminRoute><AdminAccessTokensPage /></AdminRoute>} />
                  <Route path="reports/:auditId" element={<Report />} />
                  <Route path="docs" element={<Navigate to="/docs/setup" replace />} />
                  <Route path="subscription" element={<Navigate to="/dashboard/billing" replace />} />
                </Route>

                {/* Legacy redirect for old report URLs */}
                <Route path="/reports/:auditId" element={<ReportRedirect />} />
                <Route path="/report/:slug" element={<PublicReport />} />

                {/* Legacy redirects */}
                <Route path="/settings" element={<Navigate to="/dashboard/profile" replace />} />
                <Route path="/audits" element={<Navigate to="/dashboard/analyses" replace />} />
                <Route path="/billing" element={<Navigate to="/dashboard/billing" replace />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
