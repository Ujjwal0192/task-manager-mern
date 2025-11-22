import React, { useEffect, useMemo, useState } from "react";
import DashBoardLayout from "../../components/layout/DashBoardLayout";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import moment from "moment";
import {
  LuListChecks,
  LuSearch,
  LuFilter,
  LuCalendarDays,
  LuChevronRight,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import SelectDropdown from "../../components/Inputs/SelectDropdown";

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "Pending" },
  { label: "In Progress", value: "In Progress" },
  { label: "Completed", value: "Completed" },
];

const MyTasks = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [statusSummary, setStatusSummary] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const fetchTasks = async (statusForFetch) => {
    const statusVal = statusForFetch ?? statusFilter;
    setLoading(true);
    try {
      const params = {};
      if (statusVal && statusVal !== "all") params.status = statusVal;

      const res = await axiosInstance.get(
        API_PATHS.TASKS.GET_ALL_TASKS,
        { params }
      );

      const data = res?.data ?? {};
      const list = Array.isArray(data.tasks) ? data.tasks : [];
      setTasks(list);
      setStatusSummary(data.statusSummary || null);
    } catch (err) {
      console.error("myTasks fetch error:", err);
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

    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      list = list.filter((t) => {
        const title = (t.title || "").toLowerCase();
        const desc = (t.description || "").toLowerCase();
        return title.includes(s) || desc.includes(s);
      });
    }

    // newest first
    list.sort((a, b) => {
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();
      return bDate - aDate;
    });

    return list;
  }, [tasks, searchTerm]);

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    fetchTasks(val);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    if (!newStatus) return;
    setUpdatingStatusId(taskId);

    try {
      const url = API_PATHS.TASKS.UPDATE_TASK_STATUS(taskId);
      await axiosInstance.put(url, { status: newStatus });

      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId ? { ...t, status: newStatus } : t
        )
      );
      toast.success("Status updated");
      fetchTasks(statusFilter);
    } catch (err) {
      console.error("update status error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to update status"
      );
    } finally {
      setUpdatingStatusId(null);
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

  return (
    <DashBoardLayout activeMenu="My Tasks">
      <div className="mt-5 space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-800 flex items-center gap-2">
              <LuListChecks className="text-slate-600" />
              My Tasks
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              View and manage all tasks assigned to you.
            </p>
          </div>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <UserSummaryCard
            label="All"
            value={statusSummary?.all ?? tasks.length}
            active={statusFilter === "all"}
            onClick={() => handleStatusFilterChange("all")}
          />
          <UserSummaryCard
            label="Pending"
            value={statusSummary?.pending ?? 0}
            active={statusFilter === "Pending"}
            onClick={() => handleStatusFilterChange("Pending")}
            badgeClass="bg-amber-50 border-amber-200 text-amber-700"
          />
          <UserSummaryCard
            label="In Progress"
            value={statusSummary?.inProgress ?? 0}
            active={statusFilter === "In Progress"}
            onClick={() => handleStatusFilterChange("In Progress")}
            badgeClass="bg-blue-50 border-blue-200 text-blue-700"
          />
          <UserSummaryCard
            label="Completed"
            value={statusSummary?.completed ?? 0}
            active={statusFilter === "Completed"}
            onClick={() => handleStatusFilterChange("Completed")}
            badgeClass="bg-emerald-50 border-emerald-200 text-emerald-700"
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                <LuSearch />
              </span>
              <input
                type="text"
                className="form-input text-sm pl-11"
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-56">
            <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mb-1">
              <LuFilter className="text-slate-500" />
              Status Filter
            </label>
            <SelectDropdown
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={handleStatusFilterChange}
              placeholder="Filter by status"
            />
          </div>
        </div>

        {/* Tasks list */}
        <div className="form-card">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Loading tasks...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              No tasks found.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <div
                  key={task._id}
                  className="p-3 rounded border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  {/* Left: title + desc + status + due */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800">
                        {task.title || "-"}
                      </h3>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusBadgeClass(
                          task.status
                        )}`}
                      >
                        {task.status}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                      <LuCalendarDays className="text-slate-400" />
                      <span>
                        Due{" "}
                        {task.dueDate
                          ? moment(task.dueDate).format(
                              "DD MMM YYYY, ddd"
                            )
                          : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Right: status change + actions */}
                  <div className="flex flex-col items-stretch md:items-end gap-2 min-w-[180px]">
                    <SelectDropdown
                      options={STATUS_OPTIONS.filter(
                        (o) => o.value !== "all"
                      )}
                      value={task.status}
                      onChange={(val) =>
                        handleStatusChange(task._id, val)
                      }
                      placeholder="Change status"
                    />
                    {updatingStatusId === task._id && (
                      <span className="text-[10px] text-slate-400">
                        Updating...
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/user/task-details/${task._id}`)
                      }
                      className="inline-flex items-center justify-center gap-1 text-[11px] px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-600"
                    >
                      View details
                      <LuChevronRight className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashBoardLayout>
  );
};

const UserSummaryCard = ({
  label,
  value,
  active,
  onClick,
  badgeClass = "bg-slate-50 border-slate-200 text-slate-700",
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`form-card flex flex-col items-start gap-1 cursor-pointer transition transform hover:-translate-y-0.5 hover:shadow-md ${
      active ? "ring-2 ring-slate-300" : ""
    }`}
  >
    <span className="text-[11px] text-slate-500">{label}</span>
    <span className="text-xl font-semibold text-slate-800">
      {value}
    </span>
    <span
      className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ${badgeClass}`}
    >
      {label} tasks
    </span>
  </button>
);

export default MyTasks;
