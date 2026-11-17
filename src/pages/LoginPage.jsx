import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { activateAccount, describeError, login } from "../api/client";
import { ConditionTurnstile } from "../components/ConditionTurnstile";
import { Turnstile } from "../components/Turnstile";
import { Notice, PrimaryButton, TextField } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const { enable } = useParams();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [activationError, setActivationError] = useState(null);
  const [activatedEmail, setActivatedEmail] = useState("");
  const [activating, setActivating] = useState(false);
  const [formError, setFormError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [turnstileReset, setTurnstileReset] = useState(0);
  const activationAttempted = useRef("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "", password: "" } });

  useEffect(() => {
    if (!enable) return;
    const token = decodeURIComponent(enable);
    if (!token || activationAttempted.current === token) return;
    activationAttempted.current = token;
    let cancelled = false;
    setActivating(true);
    setActivationError(null);
    setActivatedEmail("");
    activateAccount(token)
      .then((result) => {
        if (!cancelled) setActivatedEmail(result.email);
      })
      .catch((error) => {
        if (!cancelled) setActivationError(error);
      })
      .finally(() => {
        if (!cancelled) setActivating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enable]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError("");
    if (!turnstileToken) {
      setFormError(t("turnstile.required"));
      return;
    }
    try {
      const result = await login(values.email.trim(), values.password, turnstileToken);
      signIn(result.access_token);
      navigate("/tanks", { replace: true });
    } catch (error) {
      setFormError(describeError(error, t));
      setTurnstileToken(null);
      setTurnstileReset((n) => n + 1);
    }
  });

  return (
    <section className="rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-ink">{t("login.sign_in")}</h1>
      <div className="mt-4 grid gap-3">
        {activating ? <Notice tone="success">{t("login.activating")}</Notice> : null}
        {activatedEmail ? <Notice tone="success">{t("login.activated", { email: activatedEmail })}</Notice> : null}
        {activationError ? <Notice>{describeError(activationError, t)}</Notice> : null}
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
        <Turnstile
          onToken={setTurnstileToken}
          resetSignal={turnstileReset}
          language={i18n.language?.slice(0, 2)}
        />
        <PrimaryButton type="submit" disabled={isSubmitting || !turnstileToken}>
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
      <div className="mt-4">
        <ConditionTurnstile />
      </div>
    </section>
  );
}
