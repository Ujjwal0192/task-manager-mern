import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashBoardLayout from "../../components/layout/DashBoardLayout";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import moment from "moment";
import {
  LuDownload,
  LuRefreshCw,
  LuSearch,
  LuTrash2,
  LuPencilLine,
  LuFilter,
} from "react-icons/lu";
import SelectDropdown from "../../components/Inputs/SelectDropdown";

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "Pending" },
  { label: "In Progress", value: "In Progress" },
  { label: "Completed", value: "Completed" },
];

const PRIORITY_OPTIONS = [
  { label: "All priorities", value: "all" },
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
];

const ManageTasks = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [statusSummary, setStatusSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchTasks = async (statusForFetch) => {
    const statusVal = statusForFetch ?? statusFilter;
    setLoading(true);
    try {
      const params = {};
      if (statusVal && statusVal !== "all") {
        params.status = statusVal;
      }

      const res = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS, {
        params,
      });

      const data = res?.data ?? {};
      const list = Array.isArray(data.tasks) ? data.tasks : [];
      setTasks(list);
      setStatusSummary(data.statusSummary || null);
    } catch (err) {
      console.error("fetchTasks error:", err);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTasks = useMemo(() => {
    let list = [...tasks];

    if (priorityFilter !== "all") {
      list = list.filter((t) => t.priority === priorityFilter);
    }

    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      list = list.filter((t) => {
        const title = (t.title || "").toLowerCase();
        const desc = (t.description || "").toLowerCase();
        return title.includes(s) || desc.includes(s);
      });
    }

    // sort by createdAt (newest first)
    list.sort((a, b) => {
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();
      return bDate - aDate;
    });

    return list;
  }, [tasks, priorityFilter, searchTerm]);

  const handleStatusFilterChange = (statusVal) => {
    setStatusFilter(statusVal);
    fetchTasks(statusVal);
  };

  const handlePriorityFilterChange = (val) => {
    setPriorityFilter(val);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    if (!newStatus) return;
    setUpdatingStatusId(taskId);
    try {
      const url = API_PATHS.TASKS.UPDATE_TASK_STATUS(taskId);
      await axiosInstance.put(url, { status: newStatus });

      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );

      toast.success("Status updated");
      // refresh summary counts
      fetchTasks(statusFilter);
    } catch (err) {
      console.error("update status error:", err);
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleEditTask = (task) => {
    navigate("/admin/create-tasks", {
      state: { taskId: task._id },
    });
  };

  const confirmDeleteTask = (task) => {
    setTaskToDelete(task);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    setDeleting(true);
    try {
      const url = API_PATHS.TASKS.DELETE_TASK(taskToDelete._id);
      await axiosInstance.delete(url);
      toast.success("Task deleted");
      setTasks((prev) => prev.filter((t) => t._id !== taskToDelete._id));
      setTaskToDelete(null);
      fetchTasks(statusFilter);
    } catch (err) {
      console.error("delete task error:", err);
      toast.error(err?.response?.data?.message || "Failed to delete task");
    } finally {
      setDeleting(false);
    }
  };

  const handleExportTasks = async () => {
    setExporting(true);
    try {
      const url = API_PATHS.REPORTS.EXPORTS_TASKS;
      const res = await axiosInstance.get(url, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: res.headers["content-type"] || "application/octet-stream",
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `tasks-report-${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Tasks exported");
    } catch (err) {
      console.error("export tasks error:", err);
      toast.error(err?.response?.data?.message || "Failed to export tasks");
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "In Progress":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200";
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "High":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      case "Medium":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "Low":
        return "bg-slate-50 text-slate-600 border border-slate-200";
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200";
    }
  };

  return (
    <DashBoardLayout activeMenu="Manage Tasks">
      <div className="mt-5 space-y-4">
        {/* Header + Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-800">
              Manage Tasks
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              View, filter, update and export all tasks in your workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fetchTasks()}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 transition"
            >
              <LuRefreshCw
                className={`text-sm ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportTasks}
              disabled={exporting}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm"
            >
              <LuDownload className="text-sm" />
              <span>{exporting ? "Exporting..." : "Export Tasks"}</span>
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard
            label="All"
            value={statusSummary?.all ?? 0}
            active={statusFilter === "all"}
            onClick={() => handleStatusFilterChange("all")}
          />
          <SummaryCard
            label="Pending"
            value={statusSummary?.pending ?? 0}
            active={statusFilter === "Pending"}
            onClick={() => handleStatusFilterChange("Pending")}
            badgeClass="bg-amber-50 text-amber-700 border-amber-200"
          />
          <SummaryCard
            label="In Progress"
            value={statusSummary?.inProgress ?? 0}
            active={statusFilter === "In Progress"}
            onClick={() => handleStatusFilterChange("In Progress")}
            badgeClass="bg-blue-50 text-blue-700 border-blue-200"
          />
          <SummaryCard
            label="Completed"
            value={statusSummary?.completed ?? 0}
            active={statusFilter === "Completed"}
            onClick={() => handleStatusFilterChange("Completed")}
            badgeClass="bg-emerald-50 text-emerald-700 border-emerald-200"
          />
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
      {/* Icon inside input */}
      <span className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
        <LuSearch />
      </span>

      <input
        type="text"
        className="form-input text-sm pl-12"  // ⬅ increased from pl-9 to pl-11
        placeholder="Search by title or description..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  </div>

  {/* Priority Filter */}
  <div className="w-full md:w-56">
    <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mb-1">
      <LuFilter className="text-slate-500" />
      Priority
    </label>
    <SelectDropdown
      options={PRIORITY_OPTIONS}
      value={priorityFilter}
      onChange={handlePriorityFilterChange}
      placeholder="Filter by priority"
    />
  </div>
</div>


        {/* Tasks Table / List */}
        <div className="form-card">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Loading tasks...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              No tasks found. Try changing filters or create a new task.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 bg-slate-50">
                    <th className="px-3 py-2 text-left font-medium">Task</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Priority
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Due Date
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Assignees
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Created</th>
                    <th className="px-3 py-2 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task, idx) => (
                    <tr
                      key={task._id}
                      className={`border-b last:border-0 hover:bg-slate-50 transition ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                      }`}
                    >
                      {/* Task title + description */}
                      <td className="px-3 py-3 align-top">
                        <div className="font-medium text-slate-800">
                          {task.title || "-"}
                        </div>
                        {task.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                            {task.description}
                          </div>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-3 py-3 align-top">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${getPriorityBadgeClass(
                            task.priority
                          )}`}
                        >
                          {task.priority || "-"}
                        </span>
                      </td>

                      {/* Status (inline dropdown) */}
                      <td className="px-3 py-3 align-top min-w-40 space-y-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusBadgeClass(
                            task.status
                          )}`}
                        >
                          {task.status}
                        </span>

                        <SelectDropdown
                          options={STATUS_OPTIONS.filter(
                            (o) => o.value !== "all"
                          )}
                          value={task.status}
                          onChange={(val) => handleStatusChange(task._id, val)}
                          placeholder="Change status"
                        />

                        {updatingStatusId === task._id && (
                          <span className="text-[10px] text-slate-400">
                            Updating...
                          </span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="px-3 py-3 align-top">
                        <div className="text-xs text-slate-700">
                          {task.dueDate
                            ? moment(task.dueDate).format("DD MMM YYYY")
                            : "-"}
                        </div>
                      </td>

                      {/* Assignees avatar group */}
                      <td className="px-3 py-3 align-top">
                        <div className="flex -space-x-2">
                          {Array.isArray(task.assignedTo) &&
                          task.assignedTo.length > 0 ? (
                            task.assignedTo.slice(0, 4).map((user, i) => {
                              const name = user?.name || user?.email || "User";
                              const initial = name.charAt(0).toUpperCase();
                              return (
                                <div
                                  key={user._id || i}
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 ring-2 ring-white overflow-hidden text-[11px] font-semibold text-slate-700"
                                  title={name}
                                >
                                  {user.profileImageUrl ? (
                                    <img
                                      src={user.profileImageUrl}
                                      alt={name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span>{initial}</span>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              No assignee
                            </span>
                          )}
                          {Array.isArray(task.assignedTo) &&
                            task.assignedTo.length > 4 && (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 ring-2 ring-white text-[10px] text-slate-600">
                                +{task.assignedTo.length - 4}
                              </span>
                            )}
                        </div>
                      </td>

                      {/* CreatedAt */}
                      <td className="px-3 py-3 align-top">
                        <div className="text-[11px] text-slate-500">
                          {task.createdAt
                            ? moment(task.createdAt).format("DD MMM, hh:mm A")
                            : "-"}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 align-top text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditTask(task)}
                            className="p-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition"
                            title="Edit task"
                          >
                            <LuPencilLine className="text-sm" />
                          </button>

                          <button
                            type="button"
                            onClick={() => confirmDeleteTask(task)}
                            className="p-1.5 rounded-full border border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Delete task"
                          >
                            <LuTrash2 className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-md p-5 w-full max-w-md shadow-lg animate-[fadeIn_0.15s_ease-out]">
            <h3 className="text-lg font-medium text-slate-800">Delete Task</h3>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {taskToDelete.title || "this task"}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 mt-5">
              <button
                className="btn-secondary"
                onClick={() => setTaskToDelete(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="btn-primary bg-rose-500 hover:bg-rose-600"
                onClick={handleDeleteTask}
                disabled={deleting}
                type="button"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashBoardLayout>
  );
};

export default ManageTasks;

/* Summary card component */
const SummaryCard = ({
  label,
  value,
  active,
  onClick,
  badgeClass = "bg-slate-50 text-slate-700 border-slate-200",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`form-card flex flex-col items-start gap-1 cursor-pointer transition transform hover:-translate-y-0.5 hover:shadow-md ${
        active ? "ring-2 ring-slate-300" : ""
      }`}
    >
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="text-xl font-semibold text-slate-800">{value}</span>
      <span
        className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ${badgeClass}`}
      >
        {label} tasks
      </span>
    </button>
  );
};
