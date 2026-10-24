import { Menu, Moon, Sun } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Permission } from "../../lib/permissions";
import LiveClock from "./LiveClock";
import NotificationMenu from "./NotificationMenu";

const iconBtn =
  "relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

// Top control bar: page title on the left; theme, leave notifications and the
// Phnom Penh clock on the right.
export default function TopBar({ title, onToggleMenu }: { title: string; onToggleMenu: () => void }) {
  const { theme, setTheme } = useTheme();
  const { hasPermission } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" className={`${iconBtn} md:hidden`} onClick={onToggleMenu} aria-label="Open menu">
          <Menu size={18} />
        </button>
        <h1 className="truncate text-lg font-bold text-slate-800 dark:text-zinc-100">{title}</h1>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className={iconBtn}
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          title={theme === "light" ? "Dark theme" : "Light theme"}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {hasPermission(Permission.ViewLeave) && <NotificationMenu buttonClass={iconBtn} />}

        <LiveClock />
      </div>
    </header>
  );
}
