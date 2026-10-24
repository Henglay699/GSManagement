import { useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Shield,
  UserRound,
} from "lucide-react";
import PhotoPicker from "../components/user/PhotoPicker";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/api";
import {
  changeMyPassword,
  confirmEmailChange,
  removeMyPhoto,
  requestEmailChange,
  updateMyName,
  uploadMyPhoto,
} from "../services/profileService";
import type { PhotoChange } from "../types/user";

const inputClass =
  "w-full px-4 py-2.5 bg-white dark:bg-subtle border border-slate-200 dark:border-line-strong rounded-xl text-sm text-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-fg-3 dark:placeholder:text-white0";
const labelClass =
  "block text-xs font-semibold text-fg-2 mb-1.5";
const cardClass =
  "bg-surface rounded-2xl shadow-sm border border-slate-200 dark:border-line";
const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md shadow-indigo-100 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed";

function Alert({ kind, children }: { kind: "error" | "success"; children: React.ReactNode }) {
  return kind === "error" ? (
    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 rounded-xl text-sm">
      {children}
    </div>
  ) : (
    <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm">
      <CheckCircle2 size={16} className="shrink-0" />
      {children}
    </div>
  );
}

function CardHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 border-b border-line">
      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-bold text-slate-800 dark:text-white">
          {title}
        </h2>
        <p className="text-xs text-fg-2">{subtitle}</p>
      </div>
    </div>
  );
}

// Password input with a show/hide toggle.
function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          required
          autoComplete={autoComplete}
          className={`${inputClass} pr-11`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 px-3.5 flex items-center text-fg-3 hover:text-slate-600 dark:text-white0 dark:hover:text-zinc-300"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

// Two steps: (1) new email + current password -> a code is emailed to the new
// address, (2) enter the code -> the email changes.
function EmailChangeCard({
  currentEmail,
  onChanged,
}: {
  currentEmail: string;
  onChanged: () => Promise<void>;
}) {
  const [step, setStep] = useState<"idle" | "form" | "code">("idle");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reset = () => {
    setStep("idle");
    setNewEmail("");
    setPassword("");
    setCode("");
    setError(null);
  };

  const sendCode = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await requestEmailChange(newEmail, password);
      setPassword("");
      setCode("");
      setStep("code");
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't send the verification code."));
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "form") {
      await sendCode();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await confirmEmailChange(code);
      await onChanged();
      const changedTo = newEmail.trim().toLowerCase();
      reset();
      setNotice(`Your email is now ${changedTo}.`);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't confirm the code."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cardClass}>
      <CardHeader
        icon={<Mail size={18} />}
        title="Email address"
        subtitle="Used to sign in and to reset your password"
      />
      <div className="p-6 space-y-4">
        {error && <Alert kind="error">{error}</Alert>}
        {notice && <Alert kind="success">{notice}</Alert>}

        {step === "idle" && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-fg-2 truncate">
              {currentEmail}
            </span>
            <button
              type="button"
              onClick={() => {
                setNotice(null);
                setStep("form");
              }}
              className="shrink-0 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/70 rounded-2xl transition-colors"
            >
              Change
            </button>
          </div>
        )}

        {step === "form" && (
          <>
            <div>
              <label htmlFor="new-email" className={labelClass}>
                New email
              </label>
              <input
                id="new-email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                className={inputClass}
                placeholder="you@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <PasswordInput
              id="email-change-password"
              label="Current password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
            <p className="text-xs text-fg-3 dark:text-white0">
              We'll send a 6-digit code to the new address to confirm it's yours.
            </p>
          </>
        )}

        {step === "code" && (
          <>
            <p className="text-sm text-fg-2">
              Enter the 6-digit code we sent to{" "}
              <strong className="text-slate-800 dark:text-white">{newEmail}</strong>.
              It expires in 15 minutes.
            </p>
            <div>
              <label htmlFor="email-code" className={labelClass}>
                Verification code
              </label>
              <input
                id="email-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                autoFocus
                maxLength={6}
                pattern="\d{6}"
                className={`${inputClass} text-center text-lg font-semibold tracking-[0.5em]`}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <p className="text-xs text-fg-3 dark:text-white0">
              Didn't get it? Check your spam folder, or{" "}
              <button
                type="button"
                onClick={() => setStep("form")}
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                send a new code
              </button>
              .
            </p>
          </>
        )}
      </div>

      {step !== "idle" && (
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-line bg-slate-50/60 dark:bg-surface/60 rounded-b-2xl">
          <button
            type="button"
            onClick={reset}
            disabled={busy}
            className="px-4 py-2.5 text-sm font-medium text-fg-2 bg-white dark:bg-subtle border border-slate-200 dark:border-line-strong hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {step === "form" ? "Send code" : "Confirm"}
          </button>
        </div>
      )}
    </form>
  );
}

// "My Profile": every logged-in user can change their own name, photo, email
// and password here, whatever their role. Roles are managed by admins.
function ProfilePage() {
  const { user, refreshUser } = useAuth();

  // ---- Profile (name + photo) ----
  const [userName, setUserName] = useState(user?.userName ?? "");
  const [photo, setPhoto] = useState<PhotoChange>(undefined);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const nameChanged = userName.trim() !== (user?.userName ?? "");
  const profileDirty = nameChanged || photo !== undefined;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);
    try {
      if (nameChanged) await updateMyName(userName.trim());
      if (photo) await uploadMyPhoto(photo);
      else if (photo === null) await removeMyPhoto();
      // Updates the header card and the sidebar name/photo too.
      await refreshUser();
      setPhoto(undefined);
      setProfileSaved(true);
    } catch (error) {
      setProfileError(getErrorMessage(error, "Failed to save your profile."));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResetProfile = () => {
    setUserName(user?.userName ?? "");
    setPhoto(undefined);
    setProfileError(null);
    setProfileSaved(false);
  };

  // ---- Password ----
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }
    setSavingPassword(true);
    try {
      await changeMyPassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
    } catch (error) {
      setPasswordError(getErrorMessage(error, "Failed to change your password."));
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 py-2">
      {/* Header card */}
      <div className={`${cardClass} overflow-hidden`}>
        <div className="h-28 bg-linear-to-r from-indigo-500 via-violet-500 to-sky-500" />
        <div className="px-6 pb-6 flex flex-col items-center text-center -mt-12">
          <div className="w-24 h-24 rounded-full ring-4 ring-white dark:ring-surface bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center overflow-hidden shadow-md">
            {user.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">
                {user.userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h1 className="mt-3 text-xl font-bold text-slate-800 dark:text-white">
            {user.userName}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-fg-2">
            <Mail size={14} />
            {user.email}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {user.roles.length ? (
              user.roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900"
                >
                  <Shield size={12} />
                  {role}
                </span>
              ))
            ) : (
              <span className="text-xs italic text-fg-3 dark:text-white0">
                No roles assigned
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Personal information */}
        <form onSubmit={handleSaveProfile} className={`${cardClass} lg:col-span-3`}>
          <CardHeader
            icon={<UserRound size={18} />}
            title="Personal information"
            subtitle="Your photo and how your name appears to others"
          />
          <div className="p-6 space-y-5">
            {profileError && <Alert kind="error">{profileError}</Alert>}
            {profileSaved && <Alert kind="success">Your profile was updated.</Alert>}

            <PhotoPicker
              initialImageUrl={user.imageUrl}
              photo={photo}
              onChange={(p) => {
                setPhoto(p);
                setProfileSaved(false);
              }}
              onError={setProfileError}
            />

            <div>
              <label htmlFor="profile-username" className={labelClass}>
                Username
              </label>
              <input
                id="profile-username"
                type="text"
                required
                className={inputClass}
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  setProfileSaved(false);
                }}
              />
            </div>

            <p className="flex items-center gap-1.5 text-xs text-fg-3 dark:text-white0">
              <Lock size={12} className="shrink-0" />
              Your roles can only be changed by an administrator.
            </p>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-line bg-slate-50/60 dark:bg-surface/60 rounded-b-2xl">
            <button
              type="button"
              onClick={handleResetProfile}
              disabled={!profileDirty || savingProfile}
              className="px-4 py-2.5 text-sm font-medium text-fg-2 bg-white dark:bg-subtle border border-slate-200 dark:border-line-strong hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={!profileDirty || savingProfile}
              className={primaryButtonClass}
            >
              {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Profile
            </button>
          </div>
        </form>

        <div className="lg:col-span-2 space-y-6">
          <EmailChangeCard currentEmail={user.email} onChanged={refreshUser} />

          {/* Security */}
          <form onSubmit={handleChangePassword} className={cardClass}>
            <CardHeader
              icon={<KeyRound size={18} />}
              title="Security"
              subtitle="Change the password you sign in with"
            />
            <div className="p-6 space-y-4">
              {passwordError && <Alert kind="error">{passwordError}</Alert>}
              {passwordSaved && <Alert kind="success">Your password was changed.</Alert>}

              <PasswordInput
                id="current-password"
                label="Current password"
                value={currentPassword}
                onChange={setCurrentPassword}
                autoComplete="current-password"
              />
              <PasswordInput
                id="new-password"
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
              />
              <PasswordInput
                id="confirm-password"
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
              />
            </div>
            <div className="px-6 py-4 border-t border-line bg-slate-50/60 dark:bg-surface/60 rounded-b-2xl">
              <button
                type="submit"
                disabled={savingPassword}
                className={`${primaryButtonClass} w-full`}
              >
                {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                Change Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
