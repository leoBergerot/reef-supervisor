import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell, GuestLayout } from "./components/AppShell";
import { Spinner } from "./components/ui";
import { useAuth } from "./context/AuthContext";
import { useToast } from "./context/ToastContext";
import { ChartPage } from "./pages/ChartPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { GroupedMeasurePage } from "./pages/GroupedMeasurePage";
import { LoginPage } from "./pages/LoginPage";
import { MeasuresPage } from "./pages/MeasuresPage";
import { RecoverPasswordPage } from "./pages/RecoverPasswordPage";
import { RegisterPage } from "./pages/RegisterPage";
import { TanksPage } from "./pages/TanksPage";

function GuestOnly() {
  const { token, ready } = useAuth();
  const { t } = useTranslation();
  if (!ready) return <Spinner label={t("loading")} />;
  if (token) return <Navigate to="/tanks" replace />;
  return <GuestLayout />;
}

function RequireAuth() {
  const { token, ready, expired, clearExpired } = useAuth();
  const location = useLocation();
  const toast = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (!expired) return;
    toast.push(t("error.expired_session"), "warning");
    clearExpired();
  }, [expired, toast, t, clearExpired]);

  if (!ready) return <Spinner label={t("loading")} />;
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  return <AppShell />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login/:enable?" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/recover-password/:id/:token" element={<RecoverPasswordPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/tanks/:manage?" element={<TanksPage />} />
        <Route path="/measures/entry" element={<GroupedMeasurePage />} />
        <Route path="/measures" element={<MeasuresPage />} />
        <Route path="/chart" element={<ChartPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
