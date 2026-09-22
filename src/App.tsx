import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import Scanner from "@/pages/dashboard/Scanner";
import Autopilot from "@/pages/dashboard/Autopilot";
import CampaignDetail from "@/pages/dashboard/CampaignDetail";
import Analytics from "@/pages/dashboard/Analytics";
import EarningsPage from "@/pages/dashboard/Earnings";
import Bridge from "@/pages/dashboard/Bridge";
import RequireAuth from "@/components/auth/RequireAuth";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="scanner" element={<Scanner />} />
        <Route path="autopilot" element={<Autopilot />} />
        <Route path="campaign/:id" element={<CampaignDetail />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="earnings" element={<EarningsPage />} />
        <Route path="bridge" element={<Bridge />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
