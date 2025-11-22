import React, { useEffect, useMemo, useState } from "react";
import DashBoardLayout from "../../components/layout/DashBoardLayout";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import moment from "moment";
import {
  LuLayoutDashboard,
  LuListChecks,
  LuCalendarClock,
  LuCircleDashed,
  LuCheck,
} from "react-icons/lu";

// ⚠️ Adjust these paths if your charts live elsewhere
import CustomPieChart from "../../components/charts/CustomPieChart";
import CustomBarChart from "../../components/charts/CustomBarChart";

const COLORS = ["#6366f1", "#22c55e", "#f97316", "#e11d48"];

const UserDashboard = () => {
  const [data, setData] = useState(null);       // for status counts + upcoming
  const [tasks, setTasks] = useState([]);       // for priority distribution
  const [loading, setLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);

  // -------- Fetch dashboard summary (status counts + upcoming) --------
  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        API_PATHS.TASKS.GET_USER_DASHBOARD_DATA
      );
      setData(res?.data ?? null);
    } catch (err) {
      console.error("user dashboard error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  // -------- Fetch all tasks for current user (backend already filters by user) --------
  const fetchUserTasks = async () => {
    setTasksLoading(true);
    try {
      const res = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS);
      const payload = res?.data ?? {};
      const list = Array.isArray(payload.tasks) ? payload.tasks : [];
      setTasks(list);
    } catch (err) {
      console.error("user tasks fetch error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to load your tasks"
      );
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchUserTasks();
  }, []);

  const counts = data?.counts || {};

  // -------- Charts data --------

 // Pie: distribution by status (match CustomPieChart: status + count)
const pieChartData = useMemo(
  () => [
    { status: "Pending", count: counts.pending ?? 0 },
    { status: "In Progress", count: counts.inProgress ?? 0 },
    { status: "Completed", count: counts.completed ?? 0 },
  ],
  [counts.pending, counts.inProgress, counts.completed]
);


  // 📊 Bar: distribution by priority using tasks list
  const barChartData = useMemo(() => {
    let low = 0,
      medium = 0,
      high = 0;
    tasks.forEach((t) => {
      if (t.priority === "Low") low += 1;
      else if (t.priority === "Medium") medium += 1;
      else if (t.priority === "High") high += 1;
    });

    return [
      { priority: "Low", count: low },
      { priority: "Medium", count: medium },
      { priority: "High", count: high },
    ];
  }, [tasks]);

  return (
    <DashBoardLayout activeMenu="User Dashboard">
      <div className="mt-5 space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-800 flex items-center gap-2">
              <LuLayoutDashboard className="text-slate-600" />
              My Task Overview
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track your tasks, progress and upcoming deadlines at a glance.
            </p>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Assigned"
            value={counts.assigned ?? 0}
            subtitle="Total tasks assigned to you"
            tint="border-slate-200 bg-slate-50 text-slate-800"
            icon={<LuListChecks className="text-slate-500" />}
          />
          <StatCard
            label="Pending"
            value={counts.pending ?? 0}
            subtitle="Not started yet"
            tint="border-amber-200 bg-amber-50 text-amber-800"
            icon={<LuCircleDashed className="text-amber-500" />}
          />
          <StatCard
            label="In Progress"
            value={counts.inProgress ?? 0}
            subtitle="Currently working on"
            tint="border-blue-200 bg-blue-50 text-blue-800"
            icon={<LuCalendarClock className="text-blue-500" />}
          />
          <StatCard
            label="Completed"
            value={counts.completed ?? 0}
            subtitle="You’ve finished"
            tint="border-emerald-200 bg-emerald-50 text-emerald-800"
            icon={<LuCheck className="text-emerald-500" />}
          />
        </div>

        {/* 📊 Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pie chart: status */}
          <div className="form-card">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-semibold text-slate-800">
                Task Distribution by Status
              </h5>
            </div>
            <CustomPieChart data={pieChartData} colors={COLORS} />
          </div>

          {/* Bar chart: priority */}
          <div className="form-card">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-semibold text-slate-800">
                Task Distribution by Priority
              </h5>
              {tasksLoading && (
                <span className="text-[11px] text-slate-400">
                  Updating...
                </span>
              )}
            </div>
            <CustomBarChart
              data={barChartData}
              colors={COLORS}
              xKey="priority" // 👈 priority on X axis
              barKey="count"  // 👈 bar height = count
            />
          </div>
        </div>

        {/* Upcoming tasks */}
        <div className="form-card">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <LuCalendarClock className="text-slate-600" />
              Upcoming Tasks (next 7 days)
            </h2>
            <button
              type="button"
              onClick={() => {
                fetchDashboard();
                fetchUserTasks();
              }}
              className="text-[11px] text-slate-500 hover:text-slate-700"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Loading...
            </div>
          ) : !data?.upcoming || data.upcoming.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No upcoming tasks in the next 7 days.
            </div>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.upcoming.map((task) => (
                <li
                  key={task._id}
                  className="flex items-start justify-between gap-3 p-2 rounded border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition"
                >
                  <div>
                    <div className="font-medium text-slate-800 line-clamp-1">
                      {task.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Due{" "}
                      {task.dueDate
                        ? moment(task.dueDate).format(
                            "DD MMM YYYY, ddd"
                          )
                        : "-"}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 text-right">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full border ${
                        task.status === "Completed"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : task.status === "In Progress"
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "bg-amber-50 border-amber-200 text-amber-700"
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashBoardLayout>
  );
};

const StatCard = ({ label, value, subtitle, tint, icon }) => (
  <div
    className={`form-card flex flex-col gap-1 border ${tint} transition transform hover:-translate-y-0.5 hover:shadow-md`}
  >
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-slate-500">{label}</span>
      <div className="text-base">{icon}</div>
    </div>
    <div className="text-2xl font-semibold">{value}</div>
    <div className="text-[11px] text-slate-400">{subtitle}</div>
  </div>
);

export default UserDashboard;
