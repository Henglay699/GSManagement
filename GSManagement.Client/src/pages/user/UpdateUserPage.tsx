import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UserForm from "../../components/user/Userform";
import {
  fetchUsersById,
  updateUser,
  UserFormData,
} from "../../services/userservice";
import axios from "axios";
import { Loader2 } from "lucide-react";

function UpdateUserPage() {
  const { id } = useParams();
  const [initialData, setInitialData] = useState<UserFormData | undefined>();
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setError] = useState<string>();

  useEffect(() => {
    if (!id) return;

    const loadUser = async () => {
      setLoading(true);
      try {
        const foundUser = await fetchUsersById(Number(id));
        setInitialData({
          userName: foundUser.userName,
          email: foundUser.email,
          isActive: foundUser.isActive,
          roleIds: foundUser.roles ? foundUser.roles.map((r) => r.id) : [],
        });
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const message = error.response?.data.error;
          setError(message ?? "Fail to load user");
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id]);

  const handleUpdate = async (data: UserFormData) => {
    if (!id) return;
    await updateUser(Number(id), data);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <span className="text-sm">Loading user details...</span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="py-20 text-center text-sm font-medium text-rose-500">
        {errorMessage}
      </div>
    );
  }

  return (
    <UserForm
      initialValues={initialData}
      onSubmit={handleUpdate}
      isEditMode={true}
    />
  );
}

export default UpdateUserPage;
