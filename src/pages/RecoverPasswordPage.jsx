import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { describeError, resetPassword } from "../api/client";
import { Notice, PrimaryButton, TextField } from "../components/ui";

export function RecoverPasswordPage() {
  const { t } = useTranslation();
  const { id, token } = useParams();
  const [failure, setFailure] = useState(null);
  const [updated, setUpdated] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { password: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setFailure(null);
    setUpdated(null);
    try {
      const result = await resetPassword({ id, token: decodeURIComponent(token), password: values.password });
      setUpdated(result);
    } catch (error) {
      setFailure(error);
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
        <PrimaryButton type="submit" disabled={isSubmitting}>
          {t("recover.button")}
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
