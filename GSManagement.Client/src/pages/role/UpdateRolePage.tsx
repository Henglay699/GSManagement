import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Loader2,
} from "lucide-react";
import RoleForm from "../../components/role/RoleForm";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../lib/api";
import { paths } from "../../lib/paths";
import { fetchRoleById, updateRole } from "../../services/roleService";
import type { RoleFormData } from "../../types/role";

function UpdateRolePage() {
  const { id } = useParams<{ id: string }>();
  const roleId = Number(id);
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const { data: role, loading } = useAsync(
    useCallback(() => fetchRoleById(roleId), [roleId]),
    "Failed to load role.",
  );

  const handleUpdateRole = async (data: RoleFormData) => {
    setIsSubmitting(true);
    setErrorMessage(undefined);
    try {
      await updateRole(roleId, data);
      navigate(paths.roles);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to update role."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-3 px-1">
        <Link
          to={paths.roles}
          className="p-1.5 bg-surface border border-slate-200 dark:border-line-strong rounded-xl text-fg-2 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
        >
          <ChevronLeft size={16} />
        </Link>

        <div>
          <h1 className="text-base font-bold text-slate-800 dark:text-white tracking-tight leading-none">
            Update Role Configuration
          </h1>
          <p className="text-[11px] text-fg-2 mt-1 leading-none">
            Modify details and permission mappings for this role
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-xs border border-slate-200/80 dark:border-line overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-fg-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400 mb-2" />
            <span className="text-xs font-medium">Loading role details...</span>
          </div>
        ) : role ? (
          <RoleForm
            initialData={role}
            onSubmit={handleUpdateRole}
            isSubmitting={isSubmitting}
            buttonText="Update Role"
            errorMessage={errorMessage}
          />
        ) : (
          <div className="text-center py-8 text-xs text-rose-500 dark:text-rose-400 font-medium">
            Role requested could not be found.
          </div>
        )}
      </div>
    </div>
  );
}

export default UpdateRolePage;
