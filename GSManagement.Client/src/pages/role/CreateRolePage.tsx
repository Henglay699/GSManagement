import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import RoleForm from "../../components/role/RoleForm";
import axios from "axios";
import { ChevronLeft } from "lucide-react";

function CreateRolePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const navigate = useNavigate();

  const handleCreateRole = async (
    roleName: string,
    description: string,
    permissionIds: number[],
  ) => {
    setIsSubmitting(true);
    setErrorMessage(undefined);

    try {
      await axios.post("/api/role", {
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
            "Failed to create role.",
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
          <h1 className="text-base font-bold text-slate-800 tracking-tight leading-none">
            Create New Role
          </h1>

          <p className="text-[11px] text-slate-500 mt-1 leading-none">
            Establish a new security group and assign capabilities
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
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
