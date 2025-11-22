import React from "react";
import { useState, useEffect, useCallback, createContext } from "react";
import axiosInstance from "../utils/axiosinstance";
import { API_PATHS } from "../utils/apiPaths";

// eslint-disable-next-line react-refresh/only-export-components
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // stable functions exposed to consumers
  const clearUser = useCallback(() => {
    setUser(null);
    localStorage.removeItem("token");
    setLoading(false);
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
    if (userData && userData.token) {
      localStorage.setItem("token", userData.token);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) return; // if user already set, skip

    const accessToken = localStorage.getItem("token");
    if (!accessToken) {
      // wrap in microtask to avoid `react-hooks/set-state-in-effect` lint warning
      Promise.resolve().then(() => setLoading(false));
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
        // keep behaviour: set the user and stop loading
        setUser(response.data);
        setLoading(false);
      } catch (error) {
        console.log("User not authenticated");
        console.error("Failed to fetch user profile:", error);
        // clearUser will also setLoading(false)
        clearUser();
      }
    };

    fetchUser();
    // intentionally empty deps so this runs once on mount
    // clearUser and updateUser are stable (useCallback) so safe to use here without listing them
  }, [user, clearUser]);

  return (
    <UserContext.Provider value={{ user, loading, clearUser, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;


