import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { describeError, resetPassword } from "../api/client";
import { ConditionTurnstile } from "../components/ConditionTurnstile";
import { Turnstile } from "../components/Turnstile";
import { Notice, PrimaryButton, TextField } from "../components/ui";

export function RecoverPasswordPage() {
  const { t, i18n } = useTranslation();
  const { id, token } = useParams();
  const [failure, setFailure] = useState(null);
  const [updated, setUpdated] = useState(null);
  const [formError, setFormError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [turnstileReset, setTurnstileReset] = useState(0);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { password: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setFailure(null);
    setUpdated(null);
    setFormError("");
    if (!turnstileToken) {
      setFormError(t("turnstile.required"));
      return;
    }
    try {
      const result = await resetPassword({
        id,
        token: decodeURIComponent(token),
        password: values.password,
        turnstileToken,
      });
      setUpdated(result);
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
      <h1 className="text-2xl font-semibold text-ink">{t("recover.title")}</h1>
      {updated ? (
        <div className="mt-4">
          <Notice tone="success">{t("recover.updated", { email: updated.email })}</Notice>
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
          label={t("recover.password")}
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password", {
            validate: (value) =>
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/.test(value || "") ||
              t("recover.error_password"),
          })}
        />
        <Turnstile
          onToken={setTurnstileToken}
          resetSignal={turnstileReset}
          language={i18n.language?.slice(0, 2)}
        />
        <PrimaryButton type="submit" disabled={isSubmitting || !turnstileToken}>
          {t("recover.button")}
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
