import React from 'react'
import { addThousandsSeperator } from "../../utils/helper";


const CustomTooltip = ({ active, payload, label, total }) => {
  // payload is array; first item corresponds to primary barKey
  if (!active || !payload || !payload.length) return null;
  // show each bar present in payload
  return (
    <div className="bg-white shadow rounded-md p-3 text-sm border">
      <div className="font-medium mb-1">{label}</div>
      {payload.map((p) => {
        const val = p.value ?? 0;
        const name = p.name || p.dataKey || p.payload?.priority || "";
        const percent = total ? ((Number(val) / Number(total)) * 100).toFixed(1) : "0.0";
        return (
          <div key={name} className="flex justify-between text-xs text-gray-700">
            <div>{name}</div>
            <div className="text-right">
              <div>{addThousandsSeperator(val)}</div>
              <div className="text-[11px] text-gray-400">{percent}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default CustomTooltip
