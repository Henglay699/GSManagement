import { api } from "../lib/api";

// "My Profile": always acts on the logged-in user (the backend takes the id
// from the session), so no user id is passed.

export const updateMyName = async (userName: string): Promise<void> => {
  await api.put("/profile", { userName });
};

export const changeMyPassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  await api.put("/profile/password", { currentPassword, newPassword });
};

// Step 1: emails a 6-digit code to the new address.
export const requestEmailChange = async (
  newEmail: string,
  currentPassword: string,
): Promise<void> => {
  await api.post("/profile/email/request", { newEmail, currentPassword });
};

// Step 2: the email changes once the code is confirmed.
export const confirmEmailChange = async (code: string): Promise<void> => {
  await api.post("/profile/email/confirm", { code });
};

export const uploadMyPhoto = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append("file", file);
  await api.put("/profile/photo", formData);
};

export const removeMyPhoto = async (): Promise<void> => {
  await api.delete("/profile/photo");
};
