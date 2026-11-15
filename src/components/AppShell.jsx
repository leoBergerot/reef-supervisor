import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { listTanks } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useTankSelection } from "../context/TankContext";
import { LanguageSelect } from "./LanguageSelect";

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

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="mr-auto shrink-0">
            <img src="/logo.svg" alt={t("brand")} className="h-10 w-auto" />
          </Link>
          {tanks && tanks.length > 0 ? (
            <Listbox
              value={selected ? String(selected.id) : ""}
              onChange={(id) => {
                setTankId(id);
                navigate("/");
              }}
            >
              <div className="relative">
                <ListboxButton className="h-10 max-w-[14rem] truncate rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-sea">
                  {selected ? selected.name : t("menu.tank")}
                </ListboxButton>
                <ListboxOptions
                  anchor="bottom start"
                  className="z-40 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-lg focus:outline-none"
                >
                  {tanks.map((tank) => (
                    <ListboxOption
                      key={tank.id}
                      value={String(tank.id)}
                      className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[focus]:bg-cyan-50 data-[selected]:font-semibold"
                    >
                      {tank.name}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </div>
            </Listbox>
          ) : null}
          <NavLink
            to="/tanks/manage"
            className="text-sm font-medium text-ink underline-offset-4 hover:underline"
          >
            {t("menu.manage")}
          </NavLink>
          <LanguageSelect />
          <button
            type="button"
            onClick={() => {
              signOut();
              navigate("/login");
            }}
            className="h-10 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            {t("menu.logout")}
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
