import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom"; // useNavigate instead of Navigate
import AuthLayout from "../../components/layout/AuthLayout";
import Input from "../../components/inputs/Input";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/userContext";

const Login = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const {updateUser} = useContext(UserContext);
  const navigate = useNavigate(); // <<-- hook

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!validateEmail(email)) {
      setError("Invalid email format");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email,
        password,
      });

      // If your axios instance doesn't unwrap data, it's response.data
      const data = response.data || response;

      const { token, role } = data;

      if (token) {
        localStorage.setItem("token", token);
        updateUser(response.data);

        // redirect using navigate
        if (role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/user/dashboard");
        }
      } else {
        // no token -> show server message if present, else generic
        setError(data?.message || "Login succeeded but no token returned.");
      }
    } catch (err) {
      // Helpful debug logs
      console.error("Login error:", err);

      // axios error shape: err.response?.data?.message
      if (err?.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="lg:w-[70%] md:h-full flex flex-col justify-center">
        <h3 className="text-xl font-semibold text-black">Welcome Back</h3>
        <p className="text-xs text-slate-700 mt-[5px] mb-6">
          Please enter your detail to log in
        </p>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input
            value={email}
            onChange={({ target }) => setEmail(target.value)}
            label="Email Address"
            placeholder="abc@gmail.com"
            type="text"
            name="email"
          />

          <Input
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            label="Password"
            placeholder="contain[A-Z],[a-z],[0-9],[#,@,$]"
            type="password"
            name="password"
          />

          {error && <p className="text-red-500 text-xs pb-2.5">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "LOGIN"}
          </button>

          <p className="text-[13px] text-slate-800 my-3">
            Don't have an account?{" "}
            <Link className="text-primary font-medium underline" to="/signup">
              SignUp
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;
