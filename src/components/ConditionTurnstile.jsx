import { useTranslation } from "react-i18next";

export function ConditionTurnstile() {
  const { t } = useTranslation();

  return (
    <p className="text-xs leading-relaxed text-slate-500">
      {t("turnstile.terms.first")}{" "}
      <a
        className="font-medium text-ink underline-offset-2 hover:underline"
        href="https://www.cloudflare.com/turnstile-privacy-policy/"
        target="_blank"
        rel="noreferrer"
      >
        {t("turnstile.terms.privacy")}
      </a>{" "}
      {t("turnstile.terms.and")}{" "}
      <a
        className="font-medium text-ink underline-offset-2 hover:underline"
        href="https://www.cloudflare.com/website-terms/"
        target="_blank"
        rel="noreferrer"
      >
        {t("turnstile.terms.terms")}
      </a>{" "}
      {t("turnstile.terms.second")}
    </p>
  );
}
