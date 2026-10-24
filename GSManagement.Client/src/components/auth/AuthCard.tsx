import logo from "../../assets/logo.png";

// Centered card with the company logo, shared by the sign-in, forgot-password
// and reset-password pages.
export default function AuthCard({
  title,
  subtitle = "Grateful Solutions Cambodia Co., Ltd",
  onSubmit,
  children,
}: {
  title: string;
  subtitle?: string;
  onSubmit?: (e: React.FormEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-canvas">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-surface p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-line space-y-5"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center bg-white border border-slate-200/80 dark:border-line">
            <img
              src={logo}
              alt="Grateful Solutions"
              className="h-full w-auto max-w-none object-cover object-left"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              {title}
            </h1>
            <p className="text-xs text-fg-2">{subtitle}</p>
          </div>
        </div>
        {children}
      </form>
    </div>
  );
}

export const authInputClass =
  "w-full px-4 py-2.5 bg-white dark:bg-subtle border border-slate-200 dark:border-line-strong rounded-xl text-sm text-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-fg-3 dark:placeholder:text-white0";
export const authLabelClass =
  "block text-xs font-semibold text-fg-2 uppercase mb-1";
export const authButtonClass =
  "w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md shadow-indigo-100 dark:shadow-none disabled:opacity-50";

export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 rounded-xl text-sm">
      {children}
    </div>
  );
}

export function AuthSuccess({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm">
      {children}
    </div>
  );
}
