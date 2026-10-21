import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search, User } from "lucide-react";
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
        className="w-full flex items-center justify-between pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-left disabled:opacity-50"
      >
        <User
          size={14}
          className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none z-10"
        />
        <span
          className={
            selectedUser
              ? "text-slate-800 dark:text-zinc-100 font-semibold truncate"
              : "text-slate-400 dark:text-zinc-500"
          }
        >
          {loading
            ? "Loading users..."
            : selectedUser
              ? selectedUser.userName
              : placeholder}
        </span>
        {loading ? (
          <Loader2 size={14} className="animate-spin text-slate-400 shrink-0" />
        ) : (
          <ChevronDown
            size={14}
            className="text-slate-400 dark:text-zinc-500 shrink-0"
          />
        )}
      </button>

      {isOpen && !loading && (
        <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg p-2 space-y-2 max-h-64 overflow-hidden flex flex-col">
          <div className="relative flex items-center shrink-0">
            <Search
              size={14}
              className="absolute left-2.5 text-slate-400 dark:text-zinc-500 pointer-events-none"
            />
            <input
              type="text"
              autoFocus
              placeholder="Search employee by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="overflow-y-auto space-y-0.5">
            {filteredUsers.length === 0 ? (
              <div className="p-2 text-center text-xs text-slate-400 dark:text-zinc-500">
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
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-left transition-colors ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300"
                      }`}
                    >
                      {getInitials(u.userName)}
                    </div>
                    <div className="truncate flex-1">
                      <div className={isSelected ? "font-semibold" : "font-medium"}>
                        {u.userName}
                      </div>
                      {u.email && (
                        <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
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
