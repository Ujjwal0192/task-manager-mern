import axios from "axios";
import toast from "react-hot-toast";
import { BASE_URL } from "./apiPaths";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 100000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("token");
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

//Response interceptor to handle responses globally

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        window.location.href = "/login";
      } else if (error.response.status === 403) {
        toast.error("You are not allowed to perform this action.");
      } else if (error.response.status === 500) {
        console.log("Server error Please try again later");
      }
    } else if (error.code === "ECONNABORTED") {
      console.log("Request timeout. Please try again.");
    }
    return Promise.reject(error);
  }
);


export default axiosInstance;
