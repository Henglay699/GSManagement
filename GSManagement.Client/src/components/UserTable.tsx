import { Link } from "react-router-dom";
import { User } from "../models/user";
import { deleteUser } from "../services/userservice";

function UserTable({ users }: { users: User[] }) {
  const getInitial = (name?: string) =>
    name ? name.charAt(0).toUpperCase() : "?";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-100/75 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
          <tr>
            <th scope="col" className="px-6 py-3.5">
              User
            </th>
            <th scope="col" className="px-6 py-3.5">
              Email
            </th>
            <th scope="col" className="px-6 py-3.5">
              Roles
            </th>
            <th scope="col" className="px-6 py-3.5">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {users.map((user) => (
            <tr
              key={user.id}
              className="hover:bg-slate-50/80 transition-colors"
            >
              {/* User Profile */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {getInitial(user.userName)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {user.userName}
                    </div>
                    <div className="text-xs text-slate-400">ID: #{user.id}</div>
                  </div>
                </div>
              </td>

              {/* Email */}
              <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                {user.email}
              </td>

              {/* Roles */}
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1.5">
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <span
                        key={role.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                      >
                        {role.roleName}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      No roles
                    </span>
                  )}
                </div>
              </td>

              {/* Status */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.isActive === false
                      ? "bg-slate-100 text-slate-600 border border-slate-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {user.isActive === false ? "Inactive" : "Active"}
                </span>
              </td>

              {/* Actions */}
              <td className="px-6 py-4 whitespace-nowrap text-start">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    to={`/user/update/${user.id}`}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="px-3 py-1.5 text-xs font-medium text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors shadow-sm"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserTable;
