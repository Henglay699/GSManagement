import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import RoleForm from "../../components/role/RoleForm";
import { getErrorMessage } from "../../lib/api";
import { paths } from "../../lib/paths";
import { createRole } from "../../services/roleService";
import type { RoleFormData } from "../../types/role";

function CreateRolePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const handleCreateRole = async (data: RoleFormData) => {
    setIsSubmitting(true);
    setErrorMessage(undefined);
    try {
      await createRole(data);
      navigate(paths.roles);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to create role."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-3 px-1">
        <Link
          to={paths.roles}
          className="p-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
        >
          <ChevronLeft size={16} />
        </Link>

        <div>
          <h1 className="text-base font-bold text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
            Create New Role
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-none">
            Establish a new security group and assign capabilities
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-zinc-800 overflow-hidden">
        <RoleForm
          onSubmit={handleCreateRole}
          isSubmitting={isSubmitting}
          buttonText="Create Role"
          errorMessage={errorMessage}
        />
      </div>
    </div>
  );
}

export default CreateRolePage;
