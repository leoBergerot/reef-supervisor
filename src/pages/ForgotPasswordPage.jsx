import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { describeError, requestPasswordReset } from "../api/client";
import { Notice, PrimaryButton, TextField } from "../components/ui";

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [failure, setFailure] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setFailure(null);
    try {
      await requestPasswordReset(values.email.trim());
    } catch (error) {
      setFailure(error);
    }
  });

  return (
    <section className="rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-ink">{t("forgot_password.title")}</h1>
      <p className="mt-2 text-sm text-slate-600">{t("forgot_password.subtitle")}</p>
      {failure ? (
        <div className="mt-4">
          <Notice title={t("api.missing_title")}>{describeError(failure, t)}</Notice>
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
        <PrimaryButton type="submit" disabled={isSubmitting}>
          {t("forgot_password.button")}
        </PrimaryButton>
      </form>
      <p className="mt-6 text-sm">
        <Link className="font-medium text-ink underline-offset-4 hover:underline" to="/login">
          {t("login.sign_in")}
        </Link>
      </p>
    </section>
  );
}
