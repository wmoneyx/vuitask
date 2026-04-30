/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { safeFetch } from "@/lib/utils";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { GenericPage } from "./components/layout/GenericPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AdminPage } from "./pages/AdminPage";
import { RefPage } from "./pages/RefPage";
import { TaskPage } from "./pages/TaskPage";
import { GiftCodePage } from "./pages/GiftCodePage";
import { AttendancePage } from "./pages/AttendancePage";
import { WalletPage } from "./pages/WalletPage";
import { SecurityPage } from "./pages/SecurityPage";
import { VerifyTaskPage } from "./pages/VerifyTaskPage";
import { VerifyTaskProPage } from "./pages/VerifyTaskProPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RankingPage } from "./pages/RankingPage";
import { ModGamePage } from "./pages/ModGamePage";
import { TaskVipPage } from "./pages/TaskVipPage";
import { TaskPrePage } from "./pages/TaskPrePage";
import { VerifyTaskPrePage } from "./pages/VerifyTaskPrePage";

import { CommunityPage } from "./pages/CommunityPage";
import { UserProvider } from "./UserContext";

export default function App() {
  useEffect(() => {
    // Check for referral code in URL
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      sessionStorage.setItem('referralCode', refCode);
    }

    // Global User Check
    const uuid = localStorage.getItem('userUUID') || localStorage.getItem('omni_uuid');
    if (uuid) {
      // Log IP on load
      safeFetch('/api/user/log-ip', { 
        method: 'POST', 
        body: JSON.stringify({ uuid }) 
      });

      // Heartbeat every 2 minutes
      const heartbeat = () => {
        fetch('/api/user/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uuid })
        }).catch(() => {});
      };
      
      heartbeat();
      const interval = setInterval(heartbeat, 120000);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verifytask" element={<VerifyTaskPage />} />
        <Route path="/verifytaskpro" element={<VerifyTaskProPage />} />
        <Route path="/verifytaskpre" element={<VerifyTaskPrePage />} />
        <Route path="/app" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="games" element={<ModGamePage />} />
          <Route path="task" element={<TaskPage />} />
          <Route path="task-vip" element={<TaskVipPage />} />
          <Route path="task-pre" element={<TaskPrePage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="giftcode" element={<GiftCodePage />} />
          <Route path="ranking" element={<RankingPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="security" element={<SecurityPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="referral" element={<RefPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </UserProvider>
    </BrowserRouter>
  );
}

