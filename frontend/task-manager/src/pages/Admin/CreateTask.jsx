import React, { useEffect, useState, useMemo } from "react";
import DashBoardLayout from "../../components/layout/DashBoardLayout";
import { PRIORITY_DATA } from "../../utils/data";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import moment from "moment";
import {
  LuTrash2,
  LuCircleUserRound,
  LuCalendarDays,
  LuListChecks,
} from "react-icons/lu";
import SelectDropdownAdvanced from "../../components/Inputs/SelectDropdownAdvanced ";
import SelectDropdown from "../../components/Inputs/SelectDropdown";
import AttachmentsInput from "../../components/Inputs/AttachmentInput";

const CreateTasks = () => {
  const location = useLocation();
  const { taskId } = location.state || {};
  const navigate = useNavigate();


  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    priority: "Low",
    dueDate: "",
    assignedTo: [], // array of user IDs
    todoChecklist: [],
    attachments: [], // keeping this for future use
  });

  const [currentTask, setCurrentTask] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [newChecklistText, setNewChecklistText] = useState("");


  const tasksBase =
    (API_PATHS &&
      API_PATHS.TASKS &&
      (API_PATHS.TASKS.BASE || API_PATHS.TASKS.CREATE || "/api/tasks")) ||
    "/api/tasks";

  const usersListPath =
    (API_PATHS &&
      API_PATHS.USERS &&
      (API_PATHS.USERS.LIST || API_PATHS.USERS.BASE)) ||
    "/api/users";


  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await axiosInstance.get(usersListPath);

      // Your backend returns: { meta, data: [...] }
      const payload = res?.data ?? {};
      const list = Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload.users)
        ? payload.users
        : Array.isArray(payload)
        ? payload
        : [];

      setUsers(list);
    } catch (err) {
      console.error("fetchUsers error:", err);
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        label: u.name || u.email || u._id,
        value: u._id,
        icon: u.profileImageUrl || null,
      })),
    [users]
  );

  const selectedUsers = useMemo(
    () => users.filter((u) => taskData.assignedTo.includes(u._id)),
    [users, taskData.assignedTo]
  );

  const handleValueChange = (key, value) => {
    setTaskData((prev) => ({
      ...prev,
      [key]:
        key === "assignedTo"
          ? Array.isArray(value)
            ? value
            : value
            ? [value]
            : []
          : value,
    }));
  };

  const clearData = () => {
    setTaskData({
      title: "",
      description: "",
      priority: "Low",
      dueDate: "",
      assignedTo: [],
      todoChecklist: [],
      attachments: [],
    });
    setCurrentTask(null);
    setError("");
  };

 
  const addChecklistItem = (text) => {
    if (!text || !text.trim()) return;
    setTaskData((prev) => ({
      ...prev,
      todoChecklist: [
        ...prev.todoChecklist,
        { text: text.trim(), completed: false },
      ],
    }));
  };

  const toggleChecklistItem = (index) => {
    setTaskData((prev) => {
      const list = Array.isArray(prev.todoChecklist)
        ? [...prev.todoChecklist]
        : [];
      if (!list[index]) return prev;
      list[index] = { ...list[index], completed: !list[index].completed };
      return { ...prev, todoChecklist: list };
    });
  };

  const removeChecklistItem = (index) => {
    setTaskData((prev) => {
      const list = Array.isArray(prev.todoChecklist)
        ? [...prev.todoChecklist]
        : [];
      list.splice(index, 1);
      return { ...prev, todoChecklist: list };
    });
  };

  const onAddChecklist = () => {
    if (!newChecklistText.trim()) return;
    addChecklistItem(newChecklistText.trim());
    setNewChecklistText("");
  };

  
  const buildPayload = () => {
    return {
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      dueDate: taskData.dueDate
        ? new Date(taskData.dueDate).toISOString()
        : undefined,
      assignedTo: Array.isArray(taskData.assignedTo) ? taskData.assignedTo : [],
      todoChecklist: Array.isArray(taskData.todoChecklist)
        ? taskData.todoChecklist
        : [],
      attachments: taskData.attachments || [],
    };
  };

  const createTask = async () => {
  setError("");

  if (!taskData.title || !taskData.priority || !taskData.dueDate) {
    setError("Title, priority & due date are required");
    return;
  }

  setLoading(true);
  try {
    const payload = buildPayload();
    console.log("CREATE payload being sent:", payload);

    const createPath =
      (API_PATHS &&
        API_PATHS.TASKS &&
        (API_PATHS.TASKS.CREATE || API_PATHS.TASKS.BASE)) ||
      tasksBase;

    await axiosInstance.post(createPath, payload);

    // ✅ Nice popup
    toast.success("Task created successfully 🎉", {
      style: {
        borderRadius: "10px",
        background: "#0f172a",
        color: "#e5e7eb",
        fontSize: "13px",
      },
      iconTheme: {
        primary: "#22c55e",
        secondary: "#0f172a",
      },
    });

   
    clearData();


    window.scrollTo({ top: 0, behavior: "smooth" });

   
  } catch (err) {
    console.error("createTask error:", err);
    toast.error(err?.response?.data?.message || "Failed to create task");
  } finally {
    setLoading(false);
  }
};


  const updateTask = async () => {
    if (!taskId) return;

    setError("");

    if (!taskData.title || !taskData.priority || !taskData.dueDate) {
      setError("Title, priority & due date are required");
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayload();
      console.log("UPDATE payload being sent:", payload);

      const updatePath =
        (API_PATHS &&
          API_PATHS.TASKS &&
          (API_PATHS.TASKS.UPDATE ||
            `${API_PATHS.TASKS.BASE || tasksBase}/${taskId}`)) ||
        `${tasksBase}/${taskId}`;

      await axiosInstance.put(updatePath, payload);
      toast.success("Task updated");
      navigate("/admin/tasks");
    } catch (err) {
      console.error("updateTask error:", err);
      toast.error(err?.response?.data?.message || "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const deletePath =
        (API_PATHS &&
          API_PATHS.TASKS &&
          (API_PATHS.TASKS.DELETE ||
            `${API_PATHS.TASKS.BASE || tasksBase}/${taskId}`)) ||
        `${tasksBase}/${taskId}`;

      await axiosInstance.delete(deletePath);
      toast.success("Task deleted");
      setOpenDeleteAlert(false);
      navigate("/admin/tasks");
    } catch (err) {
      console.error("deleteTask error:", err);
      toast.error(err?.response?.data?.message || "Failed to delete task");
    } finally {
      setLoading(false);
    }
  };


  const getTaskDetailsById = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const getPath =
        (API_PATHS &&
          API_PATHS.TASKS &&
          (API_PATHS.TASKS.GET_BY_ID ||
            `${API_PATHS.TASKS.BASE || tasksBase}/${id}`)) ||
        `${tasksBase}/${id}`;

      const res = await axiosInstance.get(getPath);
      const data = res?.data ?? res;
      const task = data && data._id ? data : data.task ? data.task : data;

      setCurrentTask(task);

      setTaskData((prev) => ({
        ...prev,
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "Low",
        dueDate: task.dueDate ? moment(task.dueDate).format("YYYY-MM-DD") : "",
        assignedTo: Array.isArray(task.assignedTo)
          ? task.assignedTo.map((a) =>
              typeof a === "object" ? a._id || a.id : a
            )
          : [],
        todoChecklist: Array.isArray(task.todoChecklist)
          ? task.todoChecklist
          : task.todoCheckList || [],
        attachments: Array.isArray(task.attachments) ? task.attachments : [],
      }));
    } catch (err) {
      console.error("getTaskDetailsById error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to load task details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      getTaskDetailsById(taskId);
    } else {
      clearData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

 
  return (
    <DashBoardLayout activeMenu="Create Task">
      <div className="mt-5">
        <div className="grid grid-cols-1 md:grid-cols-4 mt-4 gap-4">
          {/* LEFT: MAIN FORM */}
          <div className="form-card col-span-3">
            {/* HEADER */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-xl font-medium flex items-center gap-2">
                <LuListChecks className="text-slate-500" />
                {taskId ? "Update Task" : "Create Task"}
              </h2>

              {taskId && (
                <button
                  className="flex items-center gap-1.5 text-[13px] font-medium text-rose-500 bg-rose-50 rounded px-2 py-1 border border-rose-100 hover:border-rose-300 cursor-pointer "
                  onClick={() => setOpenDeleteAlert(true)}
                  type="button"
                >
                  <LuTrash2 className="text-base" />
                  Delete
                </button>
              )}
            </div>

            {/* TITLE */}
            <div className="mt-4">
              <label className="text-xs font-medium text-slate-600">
                Task Title
              </label>
              <input
                placeholder="Create App UI"
                className="form-input"
                value={taskData.title}
                onChange={({ target }) =>
                  handleValueChange("title", target.value)
                }
              />
            </div>

            {/* DESCRIPTION */}
            <div className="mt-3">
              <label className="text-xs font-medium text-slate-600">
                Description
              </label>
              <textarea
                placeholder="Describe Task"
                rows={4}
                className="form-input"
                value={taskData.description}
                onChange={({ target }) =>
                  handleValueChange("description", target.value)
                }
              />
            </div>

            {/* PRIORITY / DUE DATE / ASSIGNED TO */}
            <div className="grid grid-cols-12 gap-4 mt-2">
              {/* PRIORITY */}
              <div className="col-span-6 md:col-span-4">
                <label className="text-xs font-medium text-slate-600">
                  Priority
                </label>
                <div className="flex items-center gap-2">
                  <SelectDropdown
                    options={PRIORITY_DATA}
                    value={taskData.priority}
                    onChange={(value) => handleValueChange("priority", value)}
                    placeholder="Select Priority"
                  />
                </div>
              </div>

              {/* DUE DATE */}
              <div className="col-span-6 md:col-span-4">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <LuCalendarDays className="text-slate-500" />
                  Due Date
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={taskData.dueDate || ""}
                  onChange={({ target }) =>
                    handleValueChange("dueDate", target.value)
                  }
                />
              </div>

              {/* Attachments */}
              

              
              <AttachmentsInput 
                attachments={taskData.attachments}
                onChange={(list) => handleValueChange("attachments", list)}
              />
            

              {/* ASSIGNED TO */}
              <div className="col-span-12 md:col-span-4 mt-2 md:mt-0">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <LuCircleUserRound className="text-slate-500" />
                  Assigned To
                </label>

                <SelectDropdownAdvanced
                  options={userOptions}
                  value={taskData.assignedTo} // array of user IDs
                  onChange={(ids) => {
                    // ids should be an array of selected user IDs
                    handleValueChange("assignedTo", ids);
                  }}
                  multi
                  searchable
                  placeholder={
                    usersLoading ? "Loading users..." : "Assign users"
                  }
                />

                {/* Selected users avatar group */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {selectedUsers.length === 0 && (
                    <span className="text-[11px] text-slate-400">
                      No assignees selected
                    </span>
                  )}

                  {selectedUsers.map((user) => (
                    <div
                      key={user._id}
                      className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 ring-2 ring-white overflow-hidden"
                      title={user.name || user.email}
                    >
                      {user.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt={user.name || user.email}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[11px] font-medium text-slate-600">
                          {(user.name || user.email || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CHECKLIST */}
            <div className="mt-4">
              <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                <LuListChecks className="text-slate-500" />
                Checklist
              </label>

              <div className="mt-2 flex gap-2">
                <input
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  placeholder="Add checklist item"
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={onAddChecklist}
                  className="btn-primary"
                >
                  Add
                </button>
              </div>

              <ul className="mt-3 space-y-2">
                {Array.isArray(taskData.todoChecklist) &&
                  taskData.todoChecklist.length === 0 && (
                    <li className="text-xs text-gray-500">
                      No checklist items
                    </li>
                  )}
                {Array.isArray(taskData.todoChecklist) &&
                  taskData.todoChecklist.map((it, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between gap-3 p-2 rounded border"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!it.completed}
                          onChange={() => toggleChecklistItem(idx)}
                        />
                        <div
                          className={`text-sm ${
                            it.completed ? "line-through text-gray-400" : ""
                          }`}
                        >
                          {it.text}
                        </div>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => removeChecklistItem(idx)}
                          className="text-rose-500 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>

            {/* ERROR */}
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap gap-3 mt-5">
              {!taskId ? (
                <button
                  className="btn-primary"
                  onClick={createTask}
                  disabled={loading}
                  type="button"
                >
                  {loading ? "Creating..." : "Create Task"}
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={updateTask}
                  disabled={loading}
                  type="button"
                >
                  {loading ? "Updating..." : "Update Task"}
                </button>
              )}

              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/admin/tasks")}
              >
                Cancel
              </button>
            </div>
          </div>

          {/* RIGHT: INFO PANEL */}
          <div className="form-card hidden md:block">
            <div>
              <h4 className="text-sm font-medium">Quick Info</h4>
              <dl className="mt-3 text-sm text-gray-700 space-y-2">
                <div>
                  <dt className="text-xs text-gray-500">Created By</dt>
                  <dd>{currentTask?.createdBy?.[0]?.name || "-"}</dd>
                </div>

                <div>
                  <dt className="text-xs text-gray-500">Created At</dt>
                  <dd>
                    {currentTask?.createdAt
                      ? moment(currentTask.createdAt).format(
                          "DD MMM YYYY, hh:mm A"
                        )
                      : "-"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-gray-500">Last Updated</dt>
                  <dd>
                    {currentTask?.updatedAt
                      ? moment(currentTask.updatedAt).format(
                          "DD MMM YYYY, hh:mm A"
                        )
                      : "-"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRM MODAL */}
      {openDeleteAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-md p-5 w-full max-w-md">
            <h3 className="text-lg font-medium">Delete Task</h3>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to delete this task? This action cannot be
              undone.
            </p>

            <div className="flex justify-end gap-3 mt-5">
              <button
                className="btn-secondary"
                onClick={() => setOpenDeleteAlert(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="btn-primary bg-rose-500 hover:bg-rose-600"
                onClick={deleteTask}
                disabled={loading}
                type="button"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashBoardLayout>
  );
};

export default CreateTasks;
