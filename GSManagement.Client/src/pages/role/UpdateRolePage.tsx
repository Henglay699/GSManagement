import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import RoleForm from "../../components/role/RoleForm";
import Role from "../../models/role";
import axios from "axios";
import { ChevronLeft, Loader2 } from "lucide-react";

function UpdateRolePage() {
  const { id } = useParams<{ id: string }>();

  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const navigate = useNavigate();

  useEffect(() => {
    const loadRole = async () => {
      try {
        const response = await axios.get<Role>(`/api/role/${id}`);

        setRole(response.data);
      } catch (error) {
        console.error("Failed to fetch role details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRole();
  }, [id]);

  const handleUpdateRole = async (
    roleName: string,
    description: string,
    permissionIds: number[],
  ) => {
    setIsSubmitting(true);
    setErrorMessage(undefined);

    try {
      await axios.put(`/api/role/${id}`, {
        id: Number(id),
        roleName,
        description,
        permissionIds,
      });

      navigate("/roles");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.error ||
            error.response?.data?.message ||
            "Failed to update role.",
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <Link
          to="/roles"
          className="p-1.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ChevronLeft size={16} />
        </Link>

        <div>
          <h3 className="text-base font-bold text-slate-800 tracking-tight leading-none">
            Update Role Configuration
          </h3>

          <p className="text-[11px] text-slate-500 mt-1 leading-none">
            Modify details and permission mappings for this role
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />

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
          <div className="text-center py-8 text-xs text-rose-500 font-medium">
            Role requested could not be found.
          </div>
        )}
      </div>
    </div>
  );
}

export default UpdateRolePage;
