import React, { useEffect, useState } from "react";
import DashBoardLayout from "../../components/layout/DashBoardLayout";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import {
  LuSearch,
  LuUsers,
  LuUser,
  LuShield,
  LuTrash2,
  LuDownload,
  LuRefreshCw,
  LuEye,
} from "react-icons/lu";
import toast from "react-hot-toast";
import SelectDropdown from "../../components/Inputs/SelectDropdown";
import moment from "moment";

const ROLE_FILTER_OPTIONS = [
  { label: "All roles", value: "all" },
  { label: "Admin", value: "admin" },
  { label: "Member", value: "member" },
];

const ROLE_SELECT_OPTIONS = [
  { label: "Admin", value: "admin" },
  { label: "Member", value: "member" },
];

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null); // for profile modal
  const [viewLoading, setViewLoading] = useState(false);

  // Fetch users with pagination, search, role filter
  const fetchUsers = async (pageOverride) => {
    const currentPage = pageOverride || page;
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit,
      };

      if (search.trim()) params.search = search.trim();
      if (roleFilter !== "all") params.role = roleFilter;

      const res = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS, {
        params,
      });

      const payload = res?.data ?? {};
      const list = Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload.users)
        ? payload.users
        : Array.isArray(payload)
        ? payload
        : [];

      setUsers(list);
      setMeta(payload.meta || null);
    } catch (error) {
      console.error("fetchUsers error:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1); // always reset to first page when opening
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when filters/search/page change
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter, search]);

  const handleRefresh = () => {
    setPage(1);
    fetchUsers(1);
  };

  const handleRoleFilterChange = (val) => {
    setRoleFilter(val);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (!meta) return;
    if (newPage < 1 || newPage > (meta.pages || 1)) return;
    setPage(newPage);
  };

  const handleExportUsers = async () => {
    setExporting(true);
    try {
      const url = API_PATHS.REPORTS.EXPORT_USERS;
      const res = await axiosInstance.get(url, { responseType: "blob" });

      const blob = new Blob([res.data], {
        type:
          res.headers["content-type"] || "application/octet-stream",
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `users-report-${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Users exported");
    } catch (err) {
      console.error("export users error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to export users"
      );
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!user || !user._id) return;

    if (!window.confirm(`Delete user "${user.name}"? This cannot be undone.`))
      return;

    setDeletingId(user._id);
    try {
      await axiosInstance.delete(API_PATHS.USERS.DELETE_USER(user._id));
      toast.success("User deleted");
      // refetch current page
      fetchUsers();
    } catch (err) {
      console.error("delete user error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to delete user"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleRoleChange = async (user, newRole) => {
    if (!user || !user._id || !newRole || user.role === newRole) return;

    setUpdatingRoleId(user._id);
    try {
      await axiosInstance.put(API_PATHS.USERS.UPDATE_USER(user._id), {
        role: newRole,
      });

      toast.success("Role updated");
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, role: newRole } : u
        )
      );
    } catch (err) {
      console.error("update role error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to update role"
      );
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const openUserProfile = async (userId) => {
    if (!userId) return;
    setViewLoading(true);
    setSelectedUser(null);
    try {
      const res = await axiosInstance.get(
        API_PATHS.USERS.GET_USER_BY_ID(userId)
      );
      const data = res?.data ?? res;
      setSelectedUser(data);
    } catch (err) {
      console.error("get user by id error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to load user details"
      );
    } finally {
      setViewLoading(false);
    }
  };

  const closeProfileModal = () => {
    setSelectedUser(null);
  };

  const renderRoleBadge = (role) => {
    const isAdmin = role === "admin";
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
          isAdmin
            ? "bg-blue-50 text-blue-700 border border-blue-200"
            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}
      >
        <LuShield className="text-[12px]" />
        {role}
      </span>
    );
  };

  return (
    <DashBoardLayout activeMenu="Manage Users">
      <div className="mt-5 space-y-4">
        {/* Header + Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-800 flex items-center gap-2">
              <LuUsers className="text-slate-600" />
              Manage Users
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Search, filter, update roles and export user data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 transition"
            >
              <LuRefreshCw
                className={`text-sm ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportUsers}
              disabled={exporting}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm"
            >
              <LuDownload className="text-sm" />
              <span>{exporting ? "Exporting..." : "Export Users"}</span>
            </button>
          </div>
        </div>

        {/* Filters + Search */}
        <div className="form-card flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Search */}
          <div className="flex-1">
            <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mb-1">
              <LuSearch className="text-slate-500" />
              Search
            </label>

            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                <LuSearch />
              </span>

              <input
                type="text"
                className="form-input text-sm pl-11"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="w-full md:w-56">
            <label className="text-[11px] font-medium text-slate-500 mb-1 block">
              Role filter
            </label>
            <SelectDropdown
              options={ROLE_FILTER_OPTIONS}
              value={roleFilter}
              onChange={handleRoleFilterChange}
              placeholder="Filter by role"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="form-card overflow-x-auto">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              No users found. Try changing filters or search.
            </div>
          ) : (
            <>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 bg-slate-50">
                    <th className="py-2.5 px-3 text-left font-medium">
                      User
                    </th>
                    <th className="py-2.5 px-3 text-left font-medium">
                      Email
                    </th>
                    <th className="py-2.5 px-3 text-left font-medium">
                      Role
                    </th>
                    <th className="py-2.5 px-3 text-left font-medium">
                      Created
                    </th>
                    <th className="py-2.5 px-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr
                      key={user._id}
                      className={`border-b last:border-0 hover:bg-slate-50 transition ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                      }`}
                    >
                      {/* User info */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          {user.profileImageUrl ? (
                            <img
                              src={user.profileImageUrl}
                              alt={user.name}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">
                              <LuUser className="text-slate-500 text-base" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">
                              {user.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              ID: {user._id.slice(-6)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-3 py-3 align-top text-slate-700">
                        {user.email}
                      </td>

                      {/* Role (badge + inline select) */}
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          {renderRoleBadge(user.role)}

                          <SelectDropdown
                            options={ROLE_SELECT_OPTIONS}
                            value={user.role}
                            onChange={(val) => handleRoleChange(user, val)}
                            placeholder="Change role"
                          />

                          {updatingRoleId === user._id && (
                            <span className="text-[10px] text-slate-400">
                              Updating role...
                            </span>
                          )}
                        </div>
                      </td>

                      {/* CreatedAt */}
                      <td className="px-3 py-3 align-top text-[11px] text-slate-500">
                        {user.createdAt
                          ? moment(user.createdAt).format(
                              "DD MMM YYYY, hh:mm A"
                            )
                          : "-"}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 align-top text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openUserProfile(user._id)}
                            className="p-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition"
                            title="View profile"
                          >
                            <LuEye className="text-sm" />
                          </button>

                          {user.role !== "admin" && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 rounded-full border border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition"
                              title="Delete user"
                              disabled={deletingId === user._id}
                            >
                              {deletingId === user._id ? (
                                <span className="text-[10px] px-1">
                                  ...
                                </span>
                              ) : (
                                <LuTrash2 className="text-sm" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {meta && meta.pages > 1 && (
                <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-[11px] text-slate-500">
                  <div>
                    Showing{" "}
                    <span className="font-medium">
                      {meta.total === 0
                        ? 0
                        : (meta.page - 1) * meta.limit + 1}
                    </span>{" "}
                    -{" "}
                    <span className="font-medium">
                      {Math.min(meta.page * meta.limit, meta.total)}
                    </span>{" "}
                    of <span className="font-medium">{meta.total}</span>{" "}
                    users
                  </div>

                  <div className="flex items-center gap-1 justify-end">
                    <button
                      type="button"
                      className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                    >
                      Prev
                    </button>
                    {Array.from({ length: meta.pages }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handlePageChange(i + 1)}
                        className={`px-2 py-1 rounded border text-xs ${
                          page === i + 1
                            ? "bg-slate-800 text-white border-slate-800"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= (meta.pages || 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-md p-5 w-full max-w-md shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {selectedUser.profileImageUrl ? (
                  <img
                    src={selectedUser.profileImageUrl}
                    alt={selectedUser.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                    <LuUser className="text-slate-500 text-lg" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-semibold text-slate-800">
                    {selectedUser.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeProfileModal}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Role</span>
                {renderRoleBadge(selectedUser.role)}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Pending tasks
                </span>
                <span className="text-xs font-medium text-slate-700">
                  {selectedUser.pendingTasks ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  In progress
                </span>
                <span className="text-xs font-medium text-slate-700">
                  {selectedUser.inProgressTasks ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Completed tasks
                </span>
                <span className="text-xs font-medium text-slate-700">
                  {selectedUser.completedTasks ?? 0}
                </span>
              </div>

              <hr className="my-3" />

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Joined</span>
                <span>
                  {selectedUser.createdAt
                    ? moment(selectedUser.createdAt).format(
                        "DD MMM YYYY, hh:mm A"
                      )
                    : "-"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Last updated</span>
                <span>
                  {selectedUser.updatedAt
                    ? moment(selectedUser.updatedAt).format(
                        "DD MMM YYYY, hh:mm A"
                      )
                    : "-"}
                </span>
              </div>
            </div>

            {viewLoading && (
              <p className="mt-3 text-[11px] text-slate-400">
                Loading latest details...
              </p>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={closeProfileModal}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashBoardLayout>
  );
};

export default ManageUsers;
