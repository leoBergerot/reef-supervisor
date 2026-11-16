import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { describeError, login, listTanks, updateCurrentUser } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useTankSelection } from "../context/TankContext";
import { useToast } from "../context/ToastContext";
import { tokenEmail } from "../lib/format";
import { LanguageSelect } from "./LanguageSelect";
import { TankPhoto } from "./TankPhoto";
import { Notice, PrimaryButton, QuietButton, TextField } from "./ui";

const languages = ["fr", "en"];

export function GuestLayout() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 pt-6">
        <Link to="/login" className="block">
          <img src="/logo.svg" alt={t("brand")} className="h-12 w-auto" />
        </Link>
        <LanguageSelect />
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-8">
        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export function AppShell() {
  const { t } = useTranslation();
  const { token, signOut } = useAuth();
  const { tankId, setTankId, revision } = useTankSelection();
  const navigate = useNavigate();
  const [tanks, setTanks] = useState(null);
  const [passwordOpen, setPasswordOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listTanks(token)
      .then((data) => {
        if (!cancelled) setTanks(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setTanks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [token, revision]);

  useEffect(() => {
    if (!tanks || !tankId) return;
    if (!tanks.some((tank) => String(tank.id) === String(tankId))) setTankId(null);
  }, [tanks, tankId, setTankId]);

  const selected = tanks?.find((tank) => String(tank.id) === String(tankId)) ?? null;
  const email = tokenEmail(token);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <Link to="/" className="shrink-0">
            <img src="/logo.svg" alt={t("brand")} className="h-9 w-auto sm:h-10" />
          </Link>

          <TankSwitcher
            token={token}
            tanks={tanks}
            selected={selected}
            onSelect={(id) => {
              setTankId(id);
              navigate("/");
            }}
          />

          <div className="ml-auto">
            <AccountMenu
              email={email}
              onChangePassword={() => setPasswordOpen(true)}
              onLogout={() => {
                signOut();
                navigate("/login");
              }}
            />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
        <Outlet />
      </main>
      <ChangePasswordDialog
        open={passwordOpen}
        email={email}
        token={token}
        onClose={() => setPasswordOpen(false)}
      />
    </div>
  );
}

function TankSwitcher({ token, tanks, selected, onSelect }) {
  const { t } = useTranslation();
  const loading = tanks == null;
  const hasTanks = Boolean(tanks?.length);

  return (
    <Menu>
      <MenuButton
        className="inline-flex min-w-0 max-w-[min(100%,16rem)] items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2 text-left shadow-sm transition hover:border-slate-300 data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-sea sm:max-w-[18rem] sm:gap-2.5 sm:pr-2.5"
        aria-label={t("menu.switch_tank")}
      >
        <span className="flex size-8 shrink-0 overflow-hidden rounded-lg bg-cyan-50 sm:size-9">
          {selected ? (
            <TankPhoto token={token} tank={selected} className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-cyan-700">
              <IconTank />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-[11px]">
            {t("menu.tank")}
          </span>
          <span className="block truncate text-sm font-semibold text-slate-900">
            {loading ? "…" : selected ? selected.name : hasTanks ? t("menu.pick_tank") : t("menu.no_tank")}
          </span>
        </span>
        <IconChevron className="size-4 shrink-0 text-slate-400" />
      </MenuButton>
      <MenuItems
        anchor="bottom start"
        className="z-40 mt-2 w-[min(100vw-1.5rem,18rem)] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg focus:outline-none"
      >
        {hasTanks ? (
          <div className="max-h-64 overflow-y-auto">
            {tanks.map((tank) => {
              const active = selected && String(selected.id) === String(tank.id);
              return (
                <MenuItem key={tank.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(String(tank.id))}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left data-[focus]:bg-cyan-50 ${
                      active ? "bg-cyan-50/70" : ""
                    }`}
                  >
                    <span className="flex size-9 shrink-0 overflow-hidden rounded-lg bg-cyan-50">
                      <TankPhoto token={token} tank={tank} className="size-full object-cover" />
                    </span>
                    <span className={`min-w-0 flex-1 truncate text-sm ${active ? "font-semibold text-ink" : "font-medium text-slate-800"}`}>
                      {tank.name}
                    </span>
                    {active ? <IconCheck className="size-4 shrink-0 text-sea" /> : null}
                  </button>
                </MenuItem>
              );
            })}
          </div>
        ) : (
          <p className="px-3 py-2 text-sm text-slate-500">{loading ? t("loading") : t("tanks.empty")}</p>
        )}
        <div className="mt-1 border-t border-slate-100 pt-1">
          <MenuItem>
            <Link
              to="/tanks/manage"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink data-[focus]:bg-slate-50"
            >
              <IconSettings className="size-4 shrink-0 text-slate-500" />
              {t("menu.manage")}
            </Link>
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  );
}

function AccountMenu({ email, onChangePassword, onLogout }) {
  const { t, i18n } = useTranslation();
  const current = i18n.resolvedLanguage?.startsWith("en") ? "en" : "fr";
  const initials = emailInitials(email);

  return (
    <Menu>
      <MenuButton
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2 text-left shadow-sm transition hover:border-slate-300 data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-sea sm:gap-2.5 sm:pr-2.5"
        aria-label={t("menu.account")}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-semibold tracking-wide text-white sm:size-9">
          {initials || <IconUser className="size-4" />}
        </span>
        <span className="hidden min-w-0 max-w-[10rem] sm:block">
          <span className="block truncate text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-[11px]">
            {t("menu.account")}
          </span>
          <span className="block truncate text-sm font-semibold text-slate-900">{email || t("menu.account")}</span>
        </span>
        <IconChevron className="hidden size-4 shrink-0 text-slate-400 sm:block" />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="z-40 mt-2 w-[min(100vw-1.5rem,17rem)] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg focus:outline-none"
      >
        {email ? (
          <div className="border-b border-slate-100 px-3 py-2 sm:hidden">
            <p className="truncate text-sm font-medium text-slate-800">{email}</p>
          </div>
        ) : null}
        <MenuItem>
          <button
            type="button"
            onClick={onChangePassword}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-800 data-[focus]:bg-cyan-50"
          >
            <IconKey className="size-4 shrink-0 text-slate-500" />
            {t("menu.manage_account")}
          </button>
        </MenuItem>
        <div className="px-2 py-1.5">
          <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {t("menu.language")}
          </p>
          <div className="grid grid-cols-2 gap-1">
            {languages.map((language) => {
              const active = language === current;
              return (
                <MenuItem key={language}>
                  <button
                    type="button"
                    onClick={() => i18n.changeLanguage(language)}
                    className={`rounded-lg px-2 py-2 text-sm data-[focus]:bg-cyan-50 ${
                      active ? "bg-cyan-50 font-semibold text-ink" : "font-medium text-slate-700"
                    }`}
                  >
                    {t(`language.${language}`)}
                  </button>
                </MenuItem>
              );
            })}
          </div>
        </div>
        <div className="border-t border-slate-100 pt-1">
          <MenuItem>
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-700 data-[focus]:bg-rose-50"
            >
              <IconLogout className="size-4 shrink-0" />
              {t("menu.logout")}
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  );
}

function ChangePasswordDialog({ open, email, token, onClose }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [failure, setFailure] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { currentPassword: "", password: "", confirm: "" },
  });

  useEffect(() => {
    if (!open) return;
    setFailure(null);
    reset({ currentPassword: "", password: "", confirm: "" });
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setFailure(null);
    if (!email) {
      setFailure({ status: 400, detail: t("account.email_missing") });
      return;
    }
    try {
      await login(email, values.currentPassword);
      await updateCurrentUser(token, { email, password: values.password });
      toast.push(t("account.password_updated"), "success");
      onClose();
    } catch (error) {
      setFailure(error);
    }
  });

  return (
    <Dialog open={open} onClose={isSubmitting ? () => {} : onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-slate-900/40" />
      <div className="fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <DialogPanel className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl">
          <DialogTitle className="text-lg font-semibold text-ink">{t("account.change_password_title")}</DialogTitle>
          {email ? <p className="mt-1 truncate text-sm text-slate-500">{email}</p> : null}
          {failure ? (
            <div className="mt-3">
              <Notice>{describeError(failure, t)}</Notice>
            </div>
          ) : null}
          <form className="mt-4 grid gap-3" onSubmit={onSubmit} noValidate>
            <TextField
              label={t("account.current_password")}
              type="password"
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              {...register("currentPassword", { required: t("account.current_password_required") })}
            />
            <TextField
              label={t("account.new_password")}
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password", {
                validate: (value) =>
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/.test(value || "") ||
                  t("recover.error_password"),
              })}
            />
            <TextField
              label={t("account.confirm_password")}
              type="password"
              autoComplete="new-password"
              error={errors.confirm?.message}
              {...register("confirm", {
                validate: (value) => value === watch("password") || t("account.password_mismatch"),
              })}
            />
            <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <QuietButton type="button" disabled={isSubmitting} onClick={onClose}>
                {t("measure.cancel")}
              </QuietButton>
              <PrimaryButton type="submit" disabled={isSubmitting || !email}>
                {t("account.save_password")}
              </PrimaryButton>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function emailInitials(email) {
  if (!email) return "";
  const local = email.split("@")[0] || "";
  const parts = local.split(/[._+\-]+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

function IconChevron({ className = "size-4" }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheck({ className = "size-4" }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M5 10.5l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTank() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
      <rect x="3" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 9.5c1.5 1.5 3.5 1.5 5 0s3.5-1.5 5 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconSettings({ className = "size-4" }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M10 3.5v1.2M10 15.3V16.5M3.5 10h1.2M15.3 10H16.5M5.4 5.4l.85.85M13.75 13.75l.85.85M5.4 14.6l.85-.85M13.75 6.25l.85-.85"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconUser({ className = "size-4" }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="10" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 15.5c1.6-2.4 3.3-3.5 5.5-3.5s3.9 1.1 5.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconKey({ className = "size-4" }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="7.5" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9.5 10h6.5M13.5 10v2.2M15.5 10v1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconLogout({ className = "size-4" }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M8 4.5H5.5A1.5 1.5 0 004 6v8a1.5 1.5 0 001.5 1.5H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10.5 10H16m0 0l-2.2-2.2M16 10l-2.2 2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
