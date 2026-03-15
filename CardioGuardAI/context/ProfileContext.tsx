import React, { createContext, useContext, useEffect, useState } from "react";
import API from "../lib/api";
import { AuthContext } from "./AuthContext";

interface ProfileContextType {
  profile: any;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  clearProfile: () => void;
}

export const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  clearProfile: () => {},
});

export const ProfileProvider = ({ children }: any) => {
  const { token, role } = useContext(AuthContext);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      if (!token || role !== "patient") {
        setProfile(null);
        setLoading(false);
        return;
      }

      const res = await API.get("/patient/me");
      setProfile(res.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setProfile(null);
      } else {
        console.log("Profile fetch error:", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token, role]);

  const refreshProfile = async () => {
    setLoading(true);
    await fetchProfile();
  };

  const clearProfile = () => {
    setProfile(null);
  };

  return (
    <ProfileContext.Provider
      value={{ profile, loading, refreshProfile, clearProfile }}
    >
      {children}
    </ProfileContext.Provider>
  );
};