import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import { validateEmail, validatePassword } from "../../utils/helper";
import ProfilePhotoSelecter from "../../components/Inputs/ProfilePhotoSelecter";
import Input from "../../components/Inputs/Input";
import { Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/userContext";
import uploadImage from "../../utils/uploadimage";

const SignUp = () => {
  const [profilePic, setProfilePic] = React.useState(null);
  const [fullName, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [adminInviteToken, setAdminInviteToken] = React.useState("");
  const [error, setError] = React.useState(null);
  
  
    const {updateUser} = useContext(UserContext);
    const navigate = useNavigate(); // <<-- hook

  const handleSignUp = async (e) => {
  e.preventDefault();

  console.log("profilePic state in SignUp:", profilePic);

  let profileImageURL = null;

  if (!fullName) {
    setError("Please enter Full Name.");
    return;
  }

  if (!validateEmail(email)) {
    setError("Invalid email format");
    return;
  }

  if (!validatePassword(password)) {
    if (!password) {
      setError("Password is required");
      return;
    }
    setError("Invalid Password format");
    return;
  }

  setError("");

  try {
    // 1) Upload image if user selected one
    if (profilePic) {
      const imgUploadRes = await uploadImage(profilePic);
      console.log("imgUploadRes from uploadImage:", imgUploadRes);

      // Support multiple possible shapes from uploadImage
      if (typeof imgUploadRes === "string") {
        // if helper returns just a URL string
        profileImageURL = imgUploadRes;
      } else if (imgUploadRes && typeof imgUploadRes === "object") {
        profileImageURL =
          imgUploadRes.imageUrl ||   // your own helper
          imgUploadRes.url ||        // e.g. Cloudinary
          imgUploadRes.secure_url || // e.g. Cloudinary
          null;
      }
    }

    const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
      name: fullName,
      email,
      password,
      profileImageUrl: profileImageURL, // 👈 correct key name for backend
      adminInviteToken,
    });

    const { token, role } = response.data;

    if (token) {
      localStorage.setItem("token", token);
      updateUser(response.data);

      if (role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    }
  } catch (err) {
    console.error("SignUp error:", err);

    if (err?.response?.data?.message) {
      setError(err.response.data.message);
    } else if (err?.message) {
      setError(err.message);
    } else {
      setError("Something went wrong. Please try again.");
    }
  }
};


  return (
    <AuthLayout>
      <div className="lg:w-full h-auto md:h-full mt-10 flex flex-col justify-center">
        <h3 className="text-xl font-semibold text-black">Create an Account</h3>
        <p className="text-xs text-slate-700 mt-[5px] mb-6  ">
          Join us today by entering your details below.
        </p>

        <form onSubmit={handleSignUp}>

          <ProfilePhotoSelecter image={profilePic} setImage={setProfilePic} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              value={fullName}
              onChange={({ target }) => setName(target.value)}
              label="Full Name"
              placeholder="Ujjwal"
              type="text"
            />

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

            <Input
              value={adminInviteToken}
              onChange={({ target }) => setAdminInviteToken(target.value)}
              label="Admin Invite Token (optional)"
              placeholder="6 Digit code"
              type="text"
            />
          </div>

          {error && <p className="text-red-500 text-xs pb-2.5">{error}</p>}

          <button type="submit" className="btn-primary">
            SIGN UP
          </button>

          <p className="text-[13px] text-slate-800 my-3">
            Already have an account?{" "}
            <Link className="text-primary font-medium underline" to="/login">
              Login
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default SignUp;
