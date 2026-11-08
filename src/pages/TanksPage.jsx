import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createTank, deleteTank, describeError, listTanks, updateTank, uploadTankPhoto } from "../api/client";
import { Notice, PrimaryButton, QuietButton, Spinner, TextField } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useTankSelection } from "../context/TankContext";
import { useToast } from "../context/ToastContext";
import { imageExtensionOk } from "../lib/format";

export function TanksPage() {
  const { t } = useTranslation();
  const { manage } = useParams();
  const managing = manage === "manage";
  const { token, signOut } = useAuth();
  const { setTankId } = useTankSelection();
  const navigate = useNavigate();
  const toast = useToast();
  const [tanks, setTanks] = useState({ loading: true, data: [], error: null });
  const [editor, setEditor] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = () => {
    setTanks((current) => ({ ...current, loading: true }));
    listTanks(token)
      .then((data) => setTanks({ loading: false, data: Array.isArray(data) ? data : [], error: null }))
      .catch((error) => {
        if (error?.status === 401) signOut();
        setTanks({ loading: false, data: [], error });
      });
  };

  useEffect(() => {
    load();
  }, [token]);

  const choose = (tank) => {
    if (managing) {
      setEditor({ mode: "edit", tank });
      return;
    }
    setTankId(tank.id);
    navigate("/");
  };

  return (
    <section className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            {managing ? t("tanks.manage") : tanks.data.length ? t("tanks.choice") : t("tanks.create")}
          </h1>
          {!tanks.loading && tanks.data.length === 0 ? <p className="mt-2 text-sm text-slate-600">{t("tanks.empty")}</p> : null}
        </div>
        <div className="flex gap-2">
          <PrimaryButton type="button" onClick={() => setEditor({ mode: "create", tank: null })}>
            {t("tanks.add")}
          </PrimaryButton>
          {managing && tanks.data.length > 0 ? (
            <Link to="/" className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
              {t("tanks.finish")}
            </Link>
          ) : null}
        </div>
      </div>
      <div className="mt-6">
        {tanks.loading ? <Spinner label={t("loading")} /> : null}
        {tanks.error ? <Notice>{describeError(tanks.error, t)}</Notice> : null}
        {!tanks.loading && !tanks.error && tanks.data.length === 0 ? <Notice tone="empty">{t("tanks.empty")}</Notice> : null}
      </div>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {tanks.data.map((tank) => (
          <li key={tank.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <button type="button" onClick={() => choose(tank)} className="block w-full text-left" aria-label={t("tanks.select", { name: tank.name })}>
              <img src="/tank-placeholder.svg" alt="" className="h-36 w-full bg-cyan-50 object-contain p-4" />
              <span className="block px-4 py-3 text-lg font-semibold text-slate-800">{tank.name}</span>
            </button>
            {managing ? (
              <div className="flex gap-2 px-4 pb-4">
                <QuietButton type="button" onClick={() => setEditor({ mode: "edit", tank })}>
                  {t("tanks.form.edit_button")}
                </QuietButton>
                <QuietButton type="button" onClick={() => setPendingDelete(tank)}>
                  {t("tanks.form.delete")}
                </QuietButton>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <TankDialog
        editor={editor}
        token={token}
        onClose={() => setEditor(null)}
        onCreated={(name) => {
          toast.push(t("tanks.form.created", { name }), "success");
          load();
        }}
      />
      <DeleteDialog
        tank={pendingDelete}
        onClose={() => setPendingDelete(null)}
      />
    </section>
  );
}

function TankDialog({ editor, token, onClose, onCreated }) {
  const { t } = useTranslation();
  const open = Boolean(editor);
  const editing = editor?.mode === "edit";
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileError, setFileError] = useState("");
  const [failures, setFailures] = useState([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: "" } });

  useEffect(() => {
    if (!open) return;
    reset({ name: editor?.tank?.name ?? "" });
    setFile(null);
    setPreview(null);
    setFileError("");
    setFailures([]);
  }, [open, editor, reset]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const onFile = (event) => {
    const next = event.target.files?.[0];
    if (!next) return;
    if (!imageExtensionOk(next)) {
      setFile(null);
      setPreview(null);
      setFileError(t("tanks.form.image_extension"));
      return;
    }
    setFileError("");
    setFile(next);
    setPreview(URL.createObjectURL(next));
  };

  const onSubmit = handleSubmit(async (values) => {
    if (fileError) return;
    const name = values.name.trim();
    const nextFailures = [];
    try {
      if (editing) {
        try {
          await updateTank(editor.tank.id, name);
        } catch (error) {
          nextFailures.push(error);
        }
        if (file) {
          try {
            await uploadTankPhoto(editor.tank.id, file);
          } catch (error) {
            nextFailures.push(error);
          }
        }
        setFailures(nextFailures);
        return;
      }
      const created = await createTank(token, name);
      if (file) {
        try {
          await uploadTankPhoto(created.id, file);
        } catch (error) {
          nextFailures.push(error);
        }
      }
      onCreated(name);
      setFailures(nextFailures);
      if (nextFailures.length === 0) onClose();
    } catch (error) {
      setFailures([error]);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-slate-900/40" />
      <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
        <DialogPanel className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl">
          <DialogTitle className="text-lg font-semibold text-ink">
            {editing ? t("tanks.form.edit_title") : t("tanks.form.create_title")}
          </DialogTitle>
          <form className="mt-4 grid gap-4" onSubmit={onSubmit} noValidate>
            {failures.map((error) => (
              <Notice key={error.functionName || error.message} title={error.code === "missing_endpoint" ? t("api.missing_title") : undefined}>
                {describeError(error, t)}
              </Notice>
            ))}
            <TextField
              label={t("tanks.form.name")}
              error={errors.name?.message}
              {...register("name", { required: t("tanks.form.name_required") })}
            />
            <div className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">{t("tanks.photo")}</span>
              <label className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-slate-200 px-3 text-sm font-medium text-ink">
                {file ? file.name : t("tanks.photo_pick")}
                <input
                  type="file"
                  accept=".png,.gif,.svg,.jpeg,.jpg,image/png,image/gif,image/svg+xml,image/jpeg"
                  onChange={onFile}
                  className="sr-only"
                />
              </label>
              <span className="text-sm text-slate-500">{t("tanks.photo_hint")}</span>
            </div>
            {fileError ? <Notice>{fileError}</Notice> : null}
            {preview ? <img src={preview} alt={t("tanks.form.current_photo")} className="h-32 w-full rounded-2xl object-contain bg-cyan-50" /> : (
              <img src="/tank-placeholder.svg" alt="" className="h-32 w-full rounded-2xl bg-cyan-50 object-contain p-3" />
            )}
            <div className="flex gap-2">
              <QuietButton type="button" onClick={onClose} className="flex-1">
                {t("tanks.form.cancel")}
              </QuietButton>
              <PrimaryButton type="submit" disabled={isSubmitting} className="flex-1">
                {editing ? t("tanks.form.edit_button") : t("tanks.form.create_button")}
              </PrimaryButton>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function DeleteDialog({ tank, onClose }) {
  const { t } = useTranslation();
  const [failure, setFailure] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setFailure(null);
  }, [tank]);

  const confirm = async () => {
    setPending(true);
    setFailure(null);
    try {
      await deleteTank(tank.id);
      onClose();
    } catch (error) {
      setFailure(error);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={Boolean(tank)} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-slate-900/40" />
      <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
        <DialogPanel className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl">
          <DialogTitle className="text-lg font-semibold text-ink">
            {t("delete_modal.title", { name: tank?.name })}
          </DialogTitle>
          <p className="mt-2 text-sm text-slate-600">{t("delete_modal.warning")}</p>
          {failure ? (
            <div className="mt-4">
              <Notice title={t("api.missing_title")}>{describeError(failure, t)}</Notice>
            </div>
          ) : null}
          <div className="mt-5 flex gap-2">
            <QuietButton type="button" onClick={onClose} className="flex-1">
              {t("delete_modal.cancel")}
            </QuietButton>
            <PrimaryButton type="button" onClick={confirm} disabled={pending} tone="danger" className="flex-1">
              {t("delete_modal.delete")}
            </PrimaryButton>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
