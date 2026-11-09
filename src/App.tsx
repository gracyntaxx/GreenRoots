import { Navigate, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/shared/Toaster";
import { ErrorBoundary } from "@/app/ErrorBoundary";
import { RealtimeBridge } from "@/app/RealtimeBridge";
import { RequireRole } from "@/app/RoleGuard";
import { AppShell } from "@/app/AppShell";
import { useSession } from "@/store/session";
import { homeForRole } from "@/lib/routing";

import WelcomePage from "@/features/auth/WelcomePage";
import LoginPage from "@/features/auth/LoginPage";
import SignupPage from "@/features/auth/SignupPage";
import ForgotPasswordPage from "@/features/auth/ForgotPasswordPage";

import HomePage from "@/features/home/HomePage";
import MarketPage from "@/features/market/MarketPage";
import ListingDetailPage from "@/features/market/ListingDetailPage";
import CheckoutPage from "@/features/checkout/CheckoutPage";
import PoolsPage from "@/features/pools/PoolsPage";
import PoolDetailPage from "@/features/pools/PoolDetailPage";
import OrdersPage from "@/features/orders/OrdersPage";
import OrderDetailPage from "@/features/orders/OrderDetailPage";
import NotificationsPage from "@/features/notifications/NotificationsPage";
import CollectionPointsPage from "@/features/collection/CollectionPointsPage";
import MePage from "@/features/profile/MePage";
import MyListingsPage from "@/features/listings/MyListingsPage";

import OverviewPage from "@/features/portal/OverviewPage";
import RequirementsPage from "@/features/portal/RequirementsPage";
import CreateRequirementPage from "@/features/portal/CreateRequirementPage";
import IndustryPoolsPage from "@/features/portal/IndustryPoolsPage";
import IndustryPoolDetailPage from "@/features/portal/IndustryPoolDetailPage";
import MatchesPage from "@/features/portal/MatchesPage";
import PaymentsPage from "@/features/portal/PaymentsPage";
import ForecastPage from "@/features/portal/ForecastPage";
import IndustryProfilePage from "@/features/portal/IndustryProfilePage";
import VerificationPage from "@/features/portal/admin/VerificationPage";
import UsersPage from "@/features/portal/admin/UsersPage";
import AdminListingsPage from "@/features/portal/admin/AdminListingsPage";
import AdminRequirementsPage from "@/features/portal/admin/AdminRequirementsPage";
import AdminCollectionPointsPage from "@/features/portal/admin/AdminCollectionPointsPage";
import ModerationPage from "@/features/portal/admin/ModerationPage";
import PayablesPage from "@/features/portal/admin/PayablesPage";
import AuditPage from "@/features/portal/admin/AuditPage";

function RootRedirect() {
  const profile = useSession((s) => s.profile);
  return <Navigate to={profile?.role ? homeForRole(profile.role) : "/welcome"} replace />;
}

function FieldIndex() {
  const profile = useSession((s) => s.profile);
  return <Navigate to={profile?.role === "buyer" ? "/app/market" : "/app/home"} replace />;
}

export default function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <RealtimeBridge />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route
            path="/app"
            element={
              <RequireRole allow="field">
                <AppShell />
              </RequireRole>
            }
          >
            <Route index element={<FieldIndex />} />
            <Route path="home" element={<HomePage />} />
            <Route path="market" element={<MarketPage />} />
            <Route path="market/:listingId" element={<ListingDetailPage />} />
            <Route path="checkout/:listingId" element={<CheckoutPage />} />
            <Route path="pools" element={<PoolsPage />} />
            <Route path="pools/:poolId" element={<PoolDetailPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:orderId" element={<OrderDetailPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="collection-points" element={<CollectionPointsPage />} />
            <Route path="me" element={<MePage />} />
            <Route path="listings" element={<MyListingsPage />} />
          </Route>

          <Route
            path="/portal"
            element={
              <RequireRole allow="portal">
                <AppShell />
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="requirements" element={<RequirementsPage />} />
            <Route path="requirements/new" element={<CreateRequirementPage />} />
            <Route path="pools" element={<IndustryPoolsPage />} />
            <Route path="pools/:poolId" element={<IndustryPoolDetailPage />} />
            <Route path="matches" element={<MatchesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="forecast" element={<ForecastPage />} />
            <Route path="profile" element={<IndustryProfilePage />} />

            <Route
              path="admin/verification"
              element={
                <RequireRole allow={["admin"]}>
                  <VerificationPage />
                </RequireRole>
              }
            />
            <Route
              path="admin/users"
              element={
                <RequireRole allow={["admin"]}>
                  <UsersPage />
                </RequireRole>
              }
            />
            <Route
              path="admin/listings"
              element={
                <RequireRole allow={["admin"]}>
                  <AdminListingsPage />
                </RequireRole>
              }
            />
            <Route
              path="admin/requirements"
              element={
                <RequireRole allow={["admin"]}>
                  <AdminRequirementsPage />
                </RequireRole>
              }
            />
            <Route
              path="admin/collection-points"
              element={
                <RequireRole allow={["admin"]}>
                  <AdminCollectionPointsPage />
                </RequireRole>
              }
            />
            <Route
              path="admin/moderation"
              element={
                <RequireRole allow={["admin"]}>
                  <ModerationPage />
                </RequireRole>
              }
            />
            <Route
              path="admin/payables"
              element={
                <RequireRole allow={["admin"]}>
                  <PayablesPage />
                </RequireRole>
              }
            />
            <Route
              path="admin/audit"
              element={
                <RequireRole allow={["admin"]}>
                  <AuditPage />
                </RequireRole>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
      <Toaster />
    </TooltipProvider>
  );
}
