import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route,Outlet,Navigate } from "react-router-dom";
import SignUp from "./pages/auth/SignUp";
import Login from "./pages/auth/Login";
import DashBoard from "./pages/admin/Dashboard";
import ManageTasks from "./pages/admin/ManageTasks";
import ManageUsers from "./pages/admin/ManageUsers";
import CreateTask from "./pages/admin/CreateTask"

import UserDashBoard from "./pages/user/UserDashboard";
import MyTasks from "./pages/user/MyTasks";
import PrivateRoute from "./routes/PrivateRoute";
import ViewTaskDeatils from "./pages/user/ViewTaskDeatils";
import  {UserContext,UserProvider } from "./context/userContext";
import { Toaster } from "react-hot-toast";
const App = () => {
  return (
    <UserProvider>
    <div className="">
      <Router>
        <Toaster position="top-middle" reverseOrder={false} />

        <Routes>
          <Route path="/login" element={<Login/>} />
          <Route path="/signUp" element={<SignUp/>} />

          {/* Admin Routes */}
          <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/dashboard" element={<DashBoard/>} />
          <Route path="/admin/tasks" element={<ManageTasks/>} />
          <Route path="/admin/create-tasks" element={<CreateTask/>} />
          <Route path="/admin/users" element={<ManageUsers/>} />
          </Route>
          
          {/* User Routes */}
          <Route element={<PrivateRoute allowedRoles={["user"]} />} >
          <Route path="/user/dashboard" element={<UserDashBoard/>} />
          <Route path="/user/my-task" element={<MyTasks/>} />
          <Route path="/user/task-details/:id" element={<ViewTaskDeatils/>} />
          </Route>

    {/*Default Route*/}
    <Route path="/" element={<Root />}/>

        </Routes>
      </Router>
    </div>
    </UserProvider>
  );
};

export default App;



const Root = () => {
  const { user, loading } = useContext(UserContext);

  // while we are determining auth status, show a loading placeholder
  if (loading) {
    // small spinner / placeholder — you can replace with your app's loader component
    return (
      <Outlet />
    );
  }

  // not logged in -> go to login
  if (!user) {
    return <Navigate to="/login"/>;
  }

  // logged in -> route by role
  return user.role === "admin" ? (
    <Navigate to="/admin/dashboard"  />
  ) : (
    <Navigate to="/user/dashboard"  />
  );
};
