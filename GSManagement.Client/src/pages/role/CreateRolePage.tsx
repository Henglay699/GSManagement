import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    <RoleForm
      title="Create New Role"
      subtitle="Name the role and choose what it can access"
      backTo={paths.roles}
      onSubmit={handleCreateRole}
      isSubmitting={isSubmitting}
      buttonText="Create Role"
      errorMessage={errorMessage}
    />
  );
}

export default CreateRolePage;
