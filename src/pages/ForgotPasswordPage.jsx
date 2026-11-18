import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { describeError, requestPasswordReset } from "../api/client";
import { ConditionTurnstile } from "../components/ConditionTurnstile";
import { Turnstile } from "../components/Turnstile";
import { Notice, PrimaryButton, TextField } from "../components/ui";

export function ForgotPasswordPage() {
  const { t, i18n } = useTranslation();
  const [failure, setFailure] = useState(null);
  const [sentEmail, setSentEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [turnstileReset, setTurnstileReset] = useState(0);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setFailure(null);
    setSentEmail("");
    setFormError("");
    if (!turnstileToken) {
      setFormError(t("turnstile.required"));
      return;
    }
    const email = values.email.trim();
    try {
      await requestPasswordReset(email, turnstileToken, {
        locale: i18n.language?.slice(0, 2) || "fr",
      });
      setSentEmail(email);
      setTurnstileToken(null);
      setTurnstileReset((n) => n + 1);
    } catch (error) {
      setFailure(error);
      setTurnstileToken(null);
      setTurnstileReset((n) => n + 1);
    }
  });

  return (
    <section className="rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-ink">{t("forgot_password.title")}</h1>
      <p className="mt-2 text-sm text-slate-600">{t("forgot_password.subtitle")}</p>
      {sentEmail ? (
        <div className="mt-4">
          <Notice tone="success">{t("forgot_password.email_sent", { email: sentEmail })}</Notice>
        </div>
      ) : null}
      {failure ? (
        <div className="mt-4">
          <Notice>{describeError(failure, t)}</Notice>
        </div>
      ) : null}
      {formError ? (
        <div className="mt-4">
          <Notice>{formError}</Notice>
        </div>
      ) : null}
      <form className="mt-5 grid gap-4" onSubmit={onSubmit} noValidate>
        <TextField
          label={t("forgot_password.email")}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email", {
            required: t("forgot_password.error_email"),
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t("register.error.email") },
          })}
        />
        <Turnstile
          onToken={setTurnstileToken}
          resetSignal={turnstileReset}
          language={i18n.language?.slice(0, 2)}
        />
        <PrimaryButton type="submit" disabled={isSubmitting || !turnstileToken}>
          {t("forgot_password.button")}
        </PrimaryButton>
      </form>
      <p className="mt-6 text-sm">
        <Link className="font-medium text-ink underline-offset-4 hover:underline" to="/login">
          {t("login.sign_in")}
        </Link>
      </p>
      <div className="mt-4">
        <ConditionTurnstile />
      </div>
    </section>
  );
}
