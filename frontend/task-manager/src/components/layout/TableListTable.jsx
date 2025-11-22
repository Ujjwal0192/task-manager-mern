import React from "react";
import moment from "moment";

const TableListTable = ({ tableData = [] }) => {
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-500 border-green-200";
      case "Pending":
        return "bg-purple-100 text-purple-500 border-purple-200";
      case "In Progress":
        return "bg-cyan-100 text-cyan-500 border-cyan-200";
      default:
        return "bg-gray-100 text-gray-500 border-gray-200";
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-500 border-red-200";
      case "Medium":
        return "bg-orange-100 text-orange-500 border-orange-200";
      case "Low":
        return "bg-green-100 text-green-500 border-green-200";
      default:
        return "bg-gray-100 text-gray-500 border-gray-200";
    }
  };

  return (
    <div className="overflow-x-auto p-0 rounded-lg mt-3">
      <table className="min-w-full">
        <thead>
          <tr className="text-left">
            <th className="py-3 px-4 text-gray-800 font-medium text-[13px]">Name</th>
            <th className="py-3 px-4 text-gray-800 font-medium text-[13px]">Status</th>
            <th className="py-3 px-4 text-gray-800 font-medium text-[13px]">Priority</th>
            <th className="py-3 px-4 text-gray-800 font-medium text-[13px]">Created On</th>
          </tr>
        </thead>

        <tbody>
          {tableData.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-4 px-4 text-sm text-gray-500">
                No tasks found
              </td>
            </tr>
          ) : (
            tableData.map((task) => {
              return (
                <tr key={task._id} className="border-t border-gray-200">
                  <td className="py-3 px-4 align-top">
                    <div className="text-sm font-medium text-gray-800">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-gray-500 mt-1">{task.description}</div>
                    )}
                  </td>

                  <td className="py-3 px-4 align-top">
                    <span
                      className={`px-2 py-1 text-xs rounded inline-block ${getStatusBadgeColor(
                        task.status
                      )}`}
                    >
                      {task.status || "N/A"}
                    </span>
                  </td>

                  <td className="py-3 px-4 align-top">
                    <span
                      className={`px-2 py-1 text-xs rounded inline-block ${getPriorityBadgeColor(
                        task.priority
                      )}`}
                    >
                      {task.priority || "N/A"}
                    </span>
                  </td>

                  <td className="py-3 px-4 align-top text-sm text-gray-600">
                    {task.createdAt ? moment(task.createdAt).format("DD MMM YYYY") : "N/A"}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TableListTable;
