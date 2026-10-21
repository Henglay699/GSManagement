import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { paths } from "../lib/paths";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500">
        <Compass size={22} />
      </div>
      <h1 className="text-base font-bold text-slate-800 dark:text-zinc-100">
        Page not found
      </h1>
      <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs">
        This page doesn't exist yet, or the link is out of date.
      </p>
      <Link
        to={paths.users}
        className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors"
      >
        Go to Users
      </Link>
    </div>
  );
}
