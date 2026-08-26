import { useEffect, useState, useMemo } from "react";
import UserTable from "../../components/user/UserTable";
import { User } from "../../models/user";
import { fetchUsers, deleteUser } from "../../services/userservice";
import * as signalR from "@microsoft/signalr";
import axios from "axios";
import {
  Search,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  LayoutGrid,
  List,
  Filter,
} from "lucide-react";
import { Link } from "react-router-dom";

function UserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // "all" | "active" | "inactive"
  const [errorMessage, setErrorMessage] = useState<string>();

  // Delete modal states
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Pagination states - Updated itemsPerPage to 12 (3 rows x 4 columns)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const itemsPerPage = 12;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const data = await fetchUsers(currentPage, itemsPerPage, searchTerm);
        setUsers(data.items);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
        setErrorMessage(undefined);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setErrorMessage("Backend server can't be reached.");
        } else {
          setErrorMessage("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [currentPage, searchTerm]);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("/api/userhub")
      .withAutomaticReconnect()
      .build();

    connection.on("UserCreated", () => {
      setCurrentPage((prev) => prev);
    });

    connection.on("UserUpdated", (updatedUser: User) => {
      setUsers((prev) =>
        prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
      );
    });

    connection.on("UserDeleted", (deletedUserId: number) => {
      setUsers((prev) => prev.filter((user) => user.id !== deletedUserId));
      setTotalCount((prev) => prev - 1);
    });

    connection.start().catch((err) => console.error("❌ SignalR Error:", err));

    return () => {
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.stop();
      }
    };
  }, []);

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter users client-side based on status selection
  const filteredUsers = useMemo(() => {
    if (statusFilter === "active") {
      return users.filter((u) => u.isActive !== false);
    }
    if (statusFilter === "inactive") {
      return users.filter((u) => u.isActive === false);
    }
    return users;
  }, [users, statusFilter]);

  const startIndex = (currentPage - 1) * itemsPerPage;

  return (
    <div className="max-w-[1400px] mx-auto space-y-3 p-2">
      {/* Top Header Section with Navigation Tabs */}
      <div className="border-b border-slate-200 pb-2">
        <div className="flex items-center gap-6 text-xs font-semibold text-slate-500 overflow-x-auto">
          <button className="text-slate-900 border-b-2 text-[22px] border-slate-900 pb-1 flex items-center gap-1.5">
            Total Users{" "}
            <span className="bg-slate-900 text-white text-[11px] px-1.5 py-0.2 rounded-full">
              {totalCount}
            </span>
          </button>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search, Status Dropdown, and Actions Toolbar */}
        <div className="p-2.5 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* Search Bar */}
            <div className="relative w-86">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                className="w-full pl-8 pr-9 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                placeholder="Search username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Sort/Filter Dropdown */}
            <div className="relative flex items-center">
              <Filter
                size={13}
                className="absolute left-2.5 text-slate-400 pointer-events-none"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-7 pr-6 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer appearance-none"
              >
                <option value="all">Status: All</option>
                <option value="active">Status: Online / Active</option>
                <option value="inactive">Status: Offline / Inactive</option>
              </select>
            </div>
          </div>

          {/* Right Toolbar Controls (View options & Add Button) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
              <button className="p-1 text-slate-800 bg-white shadow-xs rounded">
                <LayoutGrid size={14} />
              </button>
              <button className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <List size={14} />
              </button>
            </div>

            <Link to={"/user/create"}>
              <button className="inline-flex items-center justify-center gap-1 px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs rounded-lg transition-all shadow-xs">
                <Plus size={14} />
                <span>Add staff</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-sky-500 mb-2" />
            <span className="text-xs">Loading staff...</span>
          </div>
        ) : errorMessage != null ? (
          <div className="py-12 text-center text-xs font-medium text-rose-500">
            {errorMessage}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No users match the current filter.
          </div>
        ) : (
          <>
            <UserTable
              users={filteredUsers}
              onDelete={(user) => setUserToDelete(user)}
            />

            {/* Pagination Footer */}
            <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min(startIndex + itemsPerPage, totalCount)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {totalCount}
                </span>{" "}
                staff
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>

                <span className="text-xs text-slate-600 font-medium px-1">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage >= totalPages}
                  className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl p-4 max-w-sm w-full shadow-xl border border-slate-100 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  Delete Staff Member
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-slate-700">
                    {userToDelete.userName}
                  </span>
                  ?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserPage;
