import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createUser, describeError, requestAccountActivation } from "../api/client";
import { ConditionTurnstile } from "../components/ConditionTurnstile";
import { Turnstile } from "../components/Turnstile";
import { Notice, PrimaryButton, TextField } from "../components/ui";

export function RegisterPage() {
  const { t, i18n } = useTranslation();
  const [created, setCreated] = useState(null);
  const [activationError, setActivationError] = useState(null);
  const [formError, setFormError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [turnstileReset, setTurnstileReset] = useState(0);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { firstName: "", lastName: "", email: "", password: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError("");
    setCreated(null);
    setActivationError(null);
    if (!turnstileToken) {
      setFormError(t("turnstile.required"));
      return;
    }
    try {
      await createUser({
        email: values.email.trim(),
        password: values.password,
        turnstileToken,
      });
      setCreated(values);
      setTurnstileToken(null);
      setTurnstileReset((n) => n + 1);
      try {
        // Triggers activation email when the API sends mail; discard any returned token.
        await requestAccountActivation(values.email.trim());
      } catch (error) {
        setActivationError(error);
      }
    } catch (error) {
      setFormError(describeError(error, t));
      setTurnstileToken(null);
      setTurnstileReset((n) => n + 1);
    }
  });

  return (
    <section className="rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-ink">{t("register.title")}</h1>
      <div className="mt-4 grid gap-3">
        {created ? (
          <>
            <Notice tone="success">
              {t("register.account_created", {
                first_name: created.firstName,
                last_name: created.lastName,
                email: created.email,
              })}
            </Notice>
            <Notice tone="success">{t("register.check_email", { email: created.email })}</Notice>
          </>
        ) : null}
        {activationError ? <Notice>{describeError(activationError, t)}</Notice> : null}
        {formError ? <Notice>{formError}</Notice> : null}
      </div>
      <form className="mt-5 grid gap-4" onSubmit={onSubmit} noValidate>
        <TextField
          label={t("register.first_name")}
          autoComplete="given-name"
          error={errors.firstName?.message}
          {...register("firstName", { required: t("register.error.first_name") })}
        />
        <TextField
          label={t("register.last_name")}
          autoComplete="family-name"
          error={errors.lastName?.message}
          {...register("lastName", { required: t("register.error.last_name") })}
        />
        <TextField
          label={t("register.email")}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email", {
            required: t("register.error.email"),
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t("register.error.email") },
          })}
        />
        <TextField
          label={t("register.password")}
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password", {
            validate: (value) => {
              if (!/^[A-Za-z0-9]+$/.test(value || "")) return t("register.error.password_alphanumeric");
              if (value.length < 6) return t("register.error.password_short");
              return true;
            },
          })}
        />
        <Turnstile
          onToken={setTurnstileToken}
          resetSignal={turnstileReset}
          language={i18n.language?.slice(0, 2)}
        />
        <PrimaryButton type="submit" disabled={isSubmitting || !turnstileToken}>
          {t("register.button")}
        </PrimaryButton>
      </form>
      <p className="mt-6 text-sm text-slate-600">
        {t("register.has_account")}{" "}
        <Link className="font-semibold text-ink underline-offset-4 hover:underline" to="/login">
          {t("login.sign_in")}
        </Link>
      </p>
      <div className="mt-4">
        <ConditionTurnstile />
      </div>
    </section>
  );
}
