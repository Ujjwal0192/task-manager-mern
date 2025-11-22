import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";
import CustomTooltip from "./CustomTooltip";
import CustomLegend from "./CustomLegend";

const DEFAULT_COLORS = ["#7BCE00", "#F59E0B", "#EF4444"]; 
// Low = Green, Medium = Yellow, High = Red

const CustomBarChart = ({
  data = [],
  xKey = "priority",
  barKey = "count",
  colors = DEFAULT_COLORS,
}) => {
  const safeData = Array.isArray(data) ? data : [];

  if (!safeData.length) {
    return (
      <div className="h-[325px] flex items-center justify-center text-sm text-gray-500">
        No data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={325}>
      <BarChart
        data={safeData}
        margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip content={CustomTooltip} />
        <Legend content={(props) => <CustomLegend {...props} labelKey="priority" colors={colors} />} />

        <Bar dataKey={barKey} radius={[4, 4, 0, 0]}>
          {safeData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CustomBarChart;
