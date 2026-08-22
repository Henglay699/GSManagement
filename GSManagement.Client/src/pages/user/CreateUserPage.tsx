import UserForm from "../../components/user/Userform";
import { createUser, UserFormData } from "../../services/userservice";

function CreateUserPage() {
  const handleCreate = async (data: UserFormData) => {
    await createUser(data);
  };

  return <UserForm onSubmit={handleCreate} isEditMode={false} />;
}

export default CreateUserPage;
