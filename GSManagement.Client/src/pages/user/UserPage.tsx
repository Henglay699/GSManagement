import { useEffect, useState } from "react";
import UserTable from "../../components/UserTable";
import { User } from "../../models/user";
import { fetchUsers } from "../../services/userservice";
import * as signalR from "@microsoft/signalr";
import axios from "axios";
import { Search, Plus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

function UserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>();

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  const filteredUsers = users.filter(
    (user) =>
      user.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Pagination Math
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const allUsers = await fetchUsers();
        setUsers(allUsers);
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

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("/api/userhub")
      .withAutomaticReconnect()
      .build();

    connection.on("UserCreated", (newUser: User) => {
      setUsers((prevUsers) => [newUser, ...prevUsers]);
    });

    connection.on("UserUpdated", (updatedUser: User) => {
      setUsers((prevUsers) =>
        prevUsers.map((user: User) =>
          user.id === updatedUser.id ? { ...user, ...updatedUser } : user,
        ),
      );
    });

    connection.on("UserDeleted", (deletedUserId: number) => {
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== deletedUserId),
      );
    });

    connection
      .start()
      .catch((err) => console.error("❌ SignalR Connection Error:", err));

    return () => {
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.stop();
      }
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-3">
      {/* Compact Header Container */}
      <div className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight leading-none">
            User Management
          </h2>
          <p className="text-[13px] text-slate-500 mt-0.5 leading-none">
            Manage system users, roles, and status
          </p>
        </div>
        <Link to={"/user/create"}>
          <button className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl transition-all shadow-sm">
            <Plus size={15} />
            <span>Add User</span>
          </button>
        </Link>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search Bar */}
        <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-xs">
            <Search
              size={15}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
            <span className="text-xs">Loading users...</span>
          </div>
        ) : errorMessage != null ? (
          <div className="py-10 text-center text-xs font-medium text-rose-500">
            {errorMessage}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            No users found.
          </div>
        ) : (
          <>
            <UserTable users={paginatedUsers} />

            {/* Pagination Bar */}
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min(startIndex + itemsPerPage, filteredUsers.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {filteredUsers.length}
                </span>{" "}
                users
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="text-xs text-slate-600 px-1 font-medium">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default UserPage;
