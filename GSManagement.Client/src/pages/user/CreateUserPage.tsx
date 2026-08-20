import UserForm from "../../components/Userform";
import { createUser, UserFormData } from "../../services/userservice";

function CreateUserPage() {
  const handleCreate = async (data: UserFormData) => {
    await createUser(data);
  };

  return <UserForm onSubmit={handleCreate} isEditMode={false} />;
}

export default CreateUserPage;
