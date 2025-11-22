import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import CustomTooltip from "./CustomTooltip";
import CustomLegend from "./CustomLegend";

const CustomPieChart = ({ data = [], colors = [] }) => {
  // defensive: ensure data is an array
  const safeData = Array.isArray(data) ? data : [];

  // no-op render if no data
  if (safeData.length === 0) {
    return (
      <div className="h-[325px] flex items-center justify-center text-sm text-gray-500">
        No data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={325}>
      <PieChart>
        <Pie
          data={safeData}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          outerRadius={130}
          innerRadius={100}
          labelLine={false}
        >
          {safeData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length] ?? "#8884d8"} />
          ))}
        </Pie>

        <Tooltip  content={CustomTooltip}/>
        <Legend content={CustomLegend} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CustomPieChart;
