import { forwardRef, useEffect, useState } from "react";
import { Button, Field, Input, Label, Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { DayPicker } from "react-day-picker";
import { fr } from "react-day-picker/locale";
import {
  formatIsoDateForLocale,
  formatIsoDateTimeForLocale,
  isoDateToLocalDate,
  joinIsoDateTime,
  localDateToIsoDate,
  parseLocaleDateToIso,
  parseLocaleDateTimeToIso,
  splitIsoDateTime,
} from "../lib/format";

const control =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 outline-none transition data-[focus]:border-sea data-[invalid]:border-rose-500";

export function TextField({ label, error, ref, ...props }) {
  return (
    <Field className="grid gap-1.5">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <Input ref={ref} invalid={Boolean(error)} className={control} {...props} />
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
 * French UI: DD/MM/YYYY text + calendar popover. English keeps a native date input.
 */
export const DateField = forwardRef(function DateField(
  { label, error, locale = "fr", value = "", onChange, onBlur, name, ...props },
  ref,
) {
  const isFrench = !String(locale).startsWith("en");

  if (!isFrench) {
    return (
      <TextField
        ref={ref}
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
      ref={ref}
      label={label}
      error={error}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      {...props}
    />
  );
});

const FrenchDateField = forwardRef(function FrenchDateField(
  { label, error, name, value = "", onChange, onBlur, ...props },
  ref,
) {
  const [text, setText] = useState(() => formatIsoDateForLocale(value, "fr"));
  const [focused, setFocused] = useState(false);
  const selected = isoDateToLocalDate(value);

  useEffect(() => {
    if (!focused) setText(formatIsoDateForLocale(value, "fr"));
  }, [value, focused]);

  const commitIso = (iso) => {
    onChange?.(iso);
    setText(formatIsoDateForLocale(iso, "fr"));
  };

  return (
    <Field className="grid gap-1.5">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <Popover className="relative">
        <div className="flex gap-2">
          <Input
            ref={ref}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="jj/mm/aaaa"
            lang="fr-FR"
            name={name}
            value={text}
            invalid={Boolean(error)}
            className={`${control} flex-1`}
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
          <PopoverButton
            type="button"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition data-[hover]:bg-slate-50 data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-sea"
            aria-label={label}
          >
            <CalendarIcon />
          </PopoverButton>
        </div>
        <PopoverPanel
          anchor="bottom end"
          className="z-50 mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"
        >
          {({ close }) => (
            <DayPicker
              mode="single"
              locale={fr}
              selected={selected}
              defaultMonth={selected ?? new Date()}
              onSelect={(date) => {
                if (!date) {
                  commitIso("");
                  return;
                }
                commitIso(localDateToIsoDate(date));
                close();
              }}
            />
          )}
        </PopoverPanel>
      </Popover>
      {error ? (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
    </Field>
  );
});

/**
 * Locale-aware datetime field. Form value stays ISO YYYY-MM-DDTHH:mm.
 * French UI: DD/MM/YYYY + time with calendar; English keeps datetime-local.
 */
export const DateTimeField = forwardRef(function DateTimeField(
  { label, error, locale = "fr", value = "", onChange, onBlur, name, ...props },
  ref,
) {
  const isFrench = !String(locale).startsWith("en");

  if (!isFrench) {
    return (
      <TextField
        ref={ref}
        label={label}
        error={error}
        type="datetime-local"
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
    <FrenchDateTimeField
      ref={ref}
      label={label}
      error={error}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      {...props}
    />
  );
});

const FrenchDateTimeField = forwardRef(function FrenchDateTimeField(
  { label, error, name, value = "", onChange, onBlur, ...props },
  ref,
) {
  const parts = splitIsoDateTime(value);
  const [text, setText] = useState(() => formatIsoDateTimeForLocale(value, "fr"));
  const [time, setTime] = useState(() => parts.time || "00:00");
  const [focused, setFocused] = useState(false);
  const selected = isoDateToLocalDate(parts.date);

  useEffect(() => {
    if (!focused) setText(formatIsoDateTimeForLocale(value, "fr"));
    const next = splitIsoDateTime(value);
    if (next.time) setTime(next.time);
  }, [value, focused]);

  const emit = (dateIso, timeValue) => {
    const next = joinIsoDateTime(dateIso, timeValue || time || "00:00");
    onChange?.(next);
    setText(formatIsoDateTimeForLocale(next, "fr"));
  };

  return (
    <Field className="grid gap-1.5">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <Popover className="relative">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7.5rem_auto]">
          <Input
            ref={ref}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="jj/mm/aaaa hh:mm"
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
              const iso = parseLocaleDateTimeToIso(next, "fr");
              if (iso) {
                onChange?.(iso);
                const split = splitIsoDateTime(iso);
                if (split.time) setTime(split.time);
              }
            }}
            onBlur={(event) => {
              setFocused(false);
              const iso = parseLocaleDateTimeToIso(text, "fr");
              if (iso) {
                setText(formatIsoDateTimeForLocale(iso, "fr"));
                onChange?.(iso);
                const split = splitIsoDateTime(iso);
                if (split.time) setTime(split.time);
              } else if (!text.trim()) {
                setText("");
                onChange?.("");
              } else {
                setText(formatIsoDateTimeForLocale(value, "fr"));
              }
              onBlur?.(event);
            }}
            {...props}
          />
          <Input
            type="time"
            lang="fr-FR"
            value={time}
            className={control}
            aria-label={`${label} — heure`}
            onChange={(event) => {
              const nextTime = event.target.value;
              setTime(nextTime);
              const dateIso = parts.date || parseLocaleDateToIso(text.split(/\s+/)[0] ?? "", "fr");
              if (dateIso && nextTime) emit(dateIso, nextTime);
            }}
          />
          <PopoverButton
            type="button"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition data-[hover]:bg-slate-50 data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-sea"
            aria-label={label}
          >
            <CalendarIcon />
          </PopoverButton>
        </div>
        <PopoverPanel
          anchor="bottom end"
          className="z-50 mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"
        >
          {({ close }) => (
            <DayPicker
              mode="single"
              locale={fr}
              selected={selected}
              defaultMonth={selected ?? new Date()}
              onSelect={(date) => {
                if (!date) {
                  onChange?.("");
                  setText("");
                  return;
                }
                emit(localDateToIsoDate(date), time || "00:00");
                close();
              }}
            />
          )}
        </PopoverPanel>
      </Popover>
      {error ? (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
    </Field>
  );
});

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5 fill-none stroke-current stroke-[1.5]">
      <rect x="3.5" y="4.5" width="13" height="12" rx="2" />
      <path d="M3.5 8.5h13M7 3v3M13 3v3" strokeLinecap="round" />
    </svg>
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
