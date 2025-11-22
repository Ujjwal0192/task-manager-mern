import React, { useEffect, useState } from "react";
import DashBoardLayout from "../../components/layout/DashBoardLayout";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import moment from "moment";
import {
  LuArrowLeft,
  LuListChecks,
  LuCalendarDays,
  LuUser,
  LuCheckCheck,
  LuCircle,
} from "react-icons/lu";

const ViewTaskDeatils = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingChecklist, setUpdatingChecklist] = useState(false);

  const fetchTask = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        API_PATHS.TASKS.GET_TASK_BY_ID(id)
      );
      setTask(res?.data ?? null);
    } catch (err) {
      console.error("get task by id error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to load task details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (!id || !newStatus || task?.status === newStatus) return;

    setUpdatingStatus(true);
    try {
      const url = API_PATHS.TASKS.UPDATE_TASK_STATUS(id);
      await axiosInstance.put(url, { status: newStatus });
      setTask((prev) => ({ ...prev, status: newStatus }));
      toast.success("Status updated");
    } catch (err) {
      console.error("update status error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to update status"
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const toggleChecklistItem = async (index) => {
    if (!task || !Array.isArray(task.todoChecklist)) return;

    setUpdatingChecklist(true);
    try {
      const url = API_PATHS.TASKS.UPDATE_TODO_CHECKLIST(id);
      const current = task.todoChecklist[index];
      await axiosInstance.put(url, {
        itemIndex: index,
        completed: !current.completed,
      });

      const updatedList = [...task.todoChecklist];
      updatedList[index] = {
        ...current,
        completed: !current.completed,
      };

      setTask((prev) => ({ ...prev, todoChecklist: updatedList }));
    } catch (err) {
      console.error("update checklist error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to update checklist"
      );
    } finally {
      setUpdatingChecklist(false);
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
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200";
    }
  };

  return (
    <DashBoardLayout activeMenu="Task Details">
      <div className="mt-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700"
        >
          <LuArrowLeft className="text-xs" />
          Back
        </button>

        {loading ? (
          <div className="mt-6 form-card py-10 text-center text-sm text-slate-500">
            Loading task details...
          </div>
        ) : !task ? (
          <div className="mt-6 form-card py-10 text-center text-sm text-slate-500">
            Task not found.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Main info */}
            <div className="form-card md:col-span-2 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-lg md:text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <LuListChecks className="text-slate-600" />
                    {task.title}
                  </h1>
                  {task.description && (
                    <p className="mt-1 text-sm text-slate-600">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${getPriorityBadgeClass(
                      task.priority
                    )}`}
                  >
                    {task.priority || "Medium"} priority
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusBadgeClass(
                      task.status
                    )}`}
                  >
                    {task.status}
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                <div className="flex items-center gap-1">
                  <LuCalendarDays className="text-slate-400" />
                  <span>
                    Due:{" "}
                    {task.dueDate
                      ? moment(task.dueDate).format(
                          "DD MMM YYYY, hh:mm A"
                        )
                      : "-"}
                  </span>
                </div>
                <div>
                  Created:{" "}
                  {task.createdAt
                    ? moment(task.createdAt).format(
                        "DD MMM YYYY, hh:mm A"
                      )
                    : "-"}
                </div>
                <div>
                  Updated:{" "}
                  {task.updatedAt
                    ? moment(task.updatedAt).format(
                        "DD MMM YYYY, hh:mm A"
                      )
                    : "-"}
                </div>
              </div>

              {/* Status quick buttons */}
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-[11px] text-slate-500">
                  Quick status:
                </span>
                <button
                  type="button"
                  onClick={() => handleStatusChange("Pending")}
                  className="text-[11px] px-2 py-1 rounded border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
                  disabled={updatingStatus}
                >
                  Mark Pending
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange("In Progress")}
                  className="text-[11px] px-2 py-1 rounded border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                  disabled={updatingStatus}
                >
                  Mark In Progress
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange("Completed")}
                  className="text-[11px] px-2 py-1 rounded border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  disabled={updatingStatus}
                >
                  Mark Completed
                </button>
                {updatingStatus && (
                  <span className="text-[10px] text-slate-400">
                    Updating...
                  </span>
                )}
              </div>

              {/* Checklist */}
              <div className="mt-4">
                <h2 className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <LuListChecks className="text-slate-500" />
                  Checklist
                </h2>
                <ul className="mt-2 space-y-2">
                  {!Array.isArray(task.todoChecklist) ||
                  task.todoChecklist.length === 0 ? (
                    <li className="text-[11px] text-slate-400">
                      No checklist items.
                    </li>
                  ) : (
                    task.todoChecklist.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between gap-3 p-2 rounded border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition"
                      >
                        <button
                          type="button"
                          className="flex items-center gap-2"
                          onClick={() => toggleChecklistItem(idx)}
                          disabled={updatingChecklist}
                        >
                          {item.completed ? (
                            <LuCheckCheck className="text-emerald-500 text-lg" />
                          ) : (
                            <LuCircle className="text-slate-300 text-lg" />
                          )}
                          <span
                            className={`text-sm ${
                              item.completed
                                ? "line-through text-slate-400"
                                : "text-slate-700"
                            }`}
                          >
                            {item.text}
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
                {updatingChecklist && (
                  <p className="mt-1 text-[10px] text-slate-400">
                    Saving checklist...
                  </p>
                )}
              </div>
            </div>

            {/* Side info */}
            <div className="form-card space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-700 mb-2">
                  Assigned To
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(task.assignedTo) &&
                  task.assignedTo.length > 0 ? (
                    task.assignedTo.map((user, idx) => {
                      const name =
                        user?.name || user?.email || "User";
                      const initial =
                        name?.charAt(0)?.toUpperCase() || "?";
                      return (
                        <div
                          key={user._id || idx}
                          className="flex items-center gap-2 px-2 py-1 rounded border border-slate-100 bg-slate-50"
                        >
                          {user.profileImageUrl ? (
                            <img
                              src={user.profileImageUrl}
                              alt={name}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-700">
                              {initial}
                            </div>
                          )}
                          <span className="text-[11px] text-slate-700">
                            {name}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      No assignees.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-700 mb-2">
                  Created By
                </h3>
                {Array.isArray(task.createdBy) &&
                task.createdBy.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <LuUser className="text-slate-500 text-lg" />
                    <span className="text-[11px] text-slate-700">
                      {task.createdBy[0].name ||
                        task.createdBy[0].email ||
                        "User"}
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Not available.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashBoardLayout>
  );
};

export default ViewTaskDeatils;
