import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "@/pages/Landing";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import Scanner from "@/pages/dashboard/Scanner";
import Autopilot from "@/pages/dashboard/Autopilot";
import CampaignDetail from "@/pages/dashboard/CampaignDetail";
import Analytics from "@/pages/dashboard/Analytics";
import EarningsPage from "@/pages/dashboard/Earnings";
import Bridge from "@/pages/dashboard/Bridge";
import Organism from "@/pages/dashboard/Organism";
import Platform from "@/pages/dashboard/Platform";
import SocialAccounts from "@/pages/dashboard/SocialAccounts";
import Swarm from "@/pages/dashboard/Swarm";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Navigate to="/" replace />} />
      <Route path="/app" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="scanner" element={<Scanner />} />
        <Route path="autopilot" element={<Autopilot />} />
        <Route path="campaign/:id" element={<CampaignDetail />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="earnings" element={<EarningsPage />} />
        <Route path="bridge" element={<Bridge />} />
        <Route path="organism" element={<Organism />} />
        <Route path="platform" element={<Platform />} />
        <Route path="swarm" element={<Swarm />} />
        <Route path="accounts" element={<SocialAccounts />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
