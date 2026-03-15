import API from "../lib/api";

export const createProfile = async (payload: any) => {
  const res = await API.post("/patient/profile", payload);
  return res.data;
};

export const updateProfile = async (payload: any) => {
  const res = await API.put("/patient/me", payload);
  return res.data;
};