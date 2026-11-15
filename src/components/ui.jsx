import { useEffect, useState } from "react";
import { Button, Field, Input, Label } from "@headlessui/react";
import { formatIsoDateForLocale, parseLocaleDateToIso } from "../lib/format";

const control =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 outline-none transition data-[focus]:border-sea data-[invalid]:border-rose-500";

export function TextField({ label, error, ...props }) {
  return (
    <Field className="grid gap-1.5">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <Input invalid={Boolean(error)} className={control} {...props} />
      {error ? (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
    </Field>
  );
}

/**
 * Locale-aware date field. Form value stays ISO YYYY-MM-DD for the API.
 * French UI shows/edits DD/MM/YYYY; English keeps a native date input.
 */
export function DateField({ label, error, locale = "fr", value = "", onChange, onBlur, name, ...props }) {
  const isFrench = !String(locale).startsWith("en");

  if (!isFrench) {
    return (
      <TextField
        label={label}
        error={error}
        type="date"
        lang="en"
        name={name}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        onBlur={onBlur}
        {...props}
      />
    );
  }

  return (
    <FrenchDateField
      label={label}
      error={error}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      {...props}
    />
  );
}

function FrenchDateField({ label, error, name, value = "", onChange, onBlur, ...props }) {
  const [text, setText] = useState(() => formatIsoDateForLocale(value, "fr"));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(formatIsoDateForLocale(value, "fr"));
  }, [value, focused]);

  return (
    <Field className="grid gap-1.5">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <Input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="jj/mm/aaaa"
        lang="fr-FR"
        name={name}
        value={text}
        invalid={Boolean(error)}
        className={control}
        onFocus={() => setFocused(true)}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          if (!next.trim()) {
            onChange?.("");
            return;
          }
          const iso = parseLocaleDateToIso(next, "fr");
          if (iso) onChange?.(iso);
        }}
        onBlur={(event) => {
          setFocused(false);
          const iso = parseLocaleDateToIso(text, "fr");
          if (iso) {
            setText(formatIsoDateForLocale(iso, "fr"));
            onChange?.(iso);
          } else if (!text.trim()) {
            setText("");
            onChange?.("");
          } else {
            setText(formatIsoDateForLocale(value, "fr"));
          }
          onBlur?.(event);
        }}
        {...props}
      />
      {error ? (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
    </Field>
  );
}

export function PrimaryButton({ className = "", tone = "ink", ...props }) {
  const color = tone === "danger"
    ? "bg-rose-700 data-[hover]:bg-rose-800"
    : "bg-ink data-[hover]:bg-[#12485c]";
  return (
    <Button
      className={`inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-sea data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 ${color} ${className}`}
      {...props}
    />
  );
}

export function QuietButton({ className = "", ...props }) {
  return (
    <Button
      className={`inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition data-[hover]:bg-slate-50 data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-sea data-[disabled]:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function Notice({ title, children, tone = "error" }) {
  const styles =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "empty"
        ? "border-slate-200 bg-white text-slate-600"
        : "border-rose-200 bg-rose-50 text-rose-900";
  return (
    <div role={tone === "empty" ? "status" : "alert"} className={`rounded-2xl border px-4 py-3 ${styles}`}>
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <p className={title ? "mt-1 text-sm" : "text-sm"}>{children}</p> : null}
    </div>
  );
}

export function Spinner({ label }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-sea" />
      <span>{label}</span>
    </div>
  );
}
