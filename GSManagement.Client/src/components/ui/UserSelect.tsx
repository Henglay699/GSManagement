import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Loader2,
  Search,
  User as UserIcon,
} from "lucide-react";
import type { UserOption } from "../../types/user";
import { getInitials } from "../../utils/string";

interface UserSelectProps {
  users: UserOption[];
  value: string;
  onChange: (userId: string) => void;
  loading?: boolean;
  placeholder?: string;
}

// Searchable employee picker used by the attendance and leave forms.
export default function UserSelect({
  users,
  value,
  onChange,
  loading = false,
  placeholder = "-- Select Employee --",
}: UserSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const term = searchTerm.toLowerCase();
  const filteredUsers = users.filter(
    (u) =>
      u.userName.toLowerCase().includes(term) ||
      (u.email ?? "").toLowerCase().includes(term) ||
      String(u.id).includes(term),
  );

  const selectedUser = users.find((u) => String(u.id) === value);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={loading}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between pl-9 pr-3 py-2 bg-slate-50 dark:bg-subtle border border-slate-200 dark:border-line-strong rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-left disabled:opacity-50"
      >
        <UserIcon
          size={14}
          className="absolute left-3 text-fg-3 dark:text-white0 pointer-events-none z-10"
        />
        <span
          className={
            selectedUser
              ? "text-slate-800 dark:text-white font-semibold truncate"
              : "text-fg-3 dark:text-white0"
          }
        >
          {loading
            ? "Loading users..."
            : selectedUser
              ? selectedUser.userName
              : placeholder}
        </span>
        {loading ? (
          <Loader2 size={14} className="animate-spin text-fg-3 shrink-0" />
        ) : (
          <ChevronDown
            size={14}
            className="text-fg-3 dark:text-white0 shrink-0"
          />
        )}
      </button>

      {isOpen && !loading && (
        <div className="absolute z-50 mt-1.5 w-full bg-surface border border-slate-200 dark:border-line rounded-xl shadow-lg p-2 space-y-2 max-h-64 overflow-hidden flex flex-col">
          <div className="relative flex items-center shrink-0">
            <Search
              size={14}
              className="absolute left-2.5 text-fg-3 dark:text-white0 pointer-events-none"
            />
            <input
              type="text"
              autoFocus
              placeholder="Search employee by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-subtle border border-slate-200 dark:border-line-strong rounded-2xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="overflow-y-auto space-y-0.5">
            {filteredUsers.length === 0 ? (
              <div className="p-2 text-center text-xs text-fg-3 dark:text-white0">
                No employees found
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = String(u.id) === value;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onChange(String(u.id));
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-2xl text-xs text-left transition-colors ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                        : "text-fg-2 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200 dark:bg-zinc-700 text-fg-2"
                      }`}
                    >
                      {getInitials(u.userName)}
                    </div>
                    <div className="truncate flex-1">
                      <div className={isSelected ? "font-semibold" : "font-medium"}>
                        {u.userName}
                      </div>
                      {u.email && (
                        <div className="text-[10px] text-fg-3 dark:text-white0 truncate">
                          {u.email}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check
                        size={14}
                        className="shrink-0 text-indigo-600 dark:text-indigo-400"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
