import UserForm from "../../components/user/UserForm";
import { getErrorMessage } from "../../lib/api";
import { createUser, uploadUserPhoto } from "../../services/userService";
import type { PhotoChange, UserFormData } from "../../types/user";

function CreateUserPage() {
  const handleCreate = async (data: UserFormData, photo: PhotoChange) => {
    const user = await createUser(data);
    if (!photo) return;

    const uploadError = await uploadUserPhoto(user.id, photo).then(
      () => null,
      (error: unknown) => error,
    );
    if (uploadError) {
      // The user already exists at this point, so submitting again would conflict.
      throw new Error(
        `User was created, but the photo upload failed: ${getErrorMessage(uploadError, "unknown error")}. Edit the user to try again.`,
      );
    }
  };

  return <UserForm onSubmit={handleCreate} isEditMode={false} />;
}

export default CreateUserPage;
