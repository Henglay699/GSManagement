import { useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Loader2,
} from "lucide-react";
import UserForm from "../../components/user/UserForm";
import { useAsync } from "../../hooks/useAsync";
import {
  fetchUserById,
  removeUserPhoto,
  updateUser,
  uploadUserPhoto,
} from "../../services/userService";
import type { PhotoChange, UserFormData } from "../../types/user";

function UpdateUserPage() {
  const { id } = useParams();
  const userId = Number(id);

  const { data: user, loading, error } = useAsync(
    useCallback(() => fetchUserById(userId), [userId]),
    "Fail to load user",
  );

  const initialData = useMemo<UserFormData | undefined>(
    () =>
      user && {
        userName: user.userName,
        email: user.email,
        isActive: user.isActive,
        roleIds: user.roles?.map((r) => r.id) ?? [],
      },
    [user],
  );

  const handleUpdate = async (data: UserFormData, photo: PhotoChange) => {
    await updateUser(userId, data);
    if (photo) {
      await uploadUserPhoto(userId, photo);
    } else if (photo === null) {
      await removeUserPhoto(userId);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-fg-2">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400 mb-2" />
        <span className="text-sm">Loading user details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-sm font-medium text-rose-500 dark:text-rose-400">
        {error}
      </div>
    );
  }

  return (
    <UserForm
      initialValues={initialData}
      initialImageUrl={user?.imageUrl}
      onSubmit={handleUpdate}
      isEditMode={true}
    />
  );
}

export default UpdateUserPage;
