import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { activateAccount, describeError, login } from "../api/client";
import { Notice, PrimaryButton, TextField } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { t } = useTranslation();
  const { enable } = useParams();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [activationError, setActivationError] = useState(null);
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "", password: "" } });

  useEffect(() => {
    if (!enable) return undefined;
    let cancelled = false;
    activateAccount(enable).catch((error) => {
      if (!cancelled) setActivationError(error);
    });
    return () => {
      cancelled = true;
    };
  }, [enable]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError("");
    try {
      const result = await login(values.email.trim(), values.password);
      signIn(result.access_token);
      navigate("/tanks", { replace: true });
    } catch (error) {
      setFormError(describeError(error, t));
    }
  });

  return (
    <section className="rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-ink">{t("login.sign_in")}</h1>
      <div className="mt-4 grid gap-3">
        {activationError ? (
          <Notice title={t("api.missing_title")}>{describeError(activationError, t)}</Notice>
        ) : null}
        {formError ? <Notice>{formError}</Notice> : null}
      </div>
      <form className="mt-5 grid gap-4" onSubmit={onSubmit} noValidate>
        <TextField
          label={t("login.email")}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email", {
            required: t("register.error.email"),
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t("register.error.email") },
          })}
        />
        <TextField
          label={t("login.password")}
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password", { required: t("login.password") })}
        />
        <PrimaryButton type="submit" disabled={isSubmitting}>
          {t("login.sign_in_button")}
        </PrimaryButton>
      </form>
      <p className="mt-4 text-sm">
        <Link className="font-medium text-ink underline-offset-4 hover:underline" to="/forgot-password">
          {t("login.forgotten_password")}
        </Link>
      </p>
      <p className="mt-6 text-sm text-slate-600">
        {t("login.first_visit")}{" "}
        <Link className="font-semibold text-ink underline-offset-4 hover:underline" to="/register">
          {t("login.sign_up")}
        </Link>
      </p>
    </section>
  );
}
