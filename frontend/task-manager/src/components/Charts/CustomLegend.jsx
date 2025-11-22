
import React from "react";


const CustomLegend = ({ payload, data = [], colors = [], labelKey = "name" }) => {
  // prefer Recharts payload if present (it contains color and payload)
  let items = [];

  if (Array.isArray(payload) && payload.length > 0) {
    // normalize recharts payload into simple { label, color } items
    items = payload.map((p, idx) => {
      // p.payload is the original data entry
      const source = p.payload || {};
      const label =
        // try Recharts's value/name, then payload[labelKey], then fallback to value
        p.value ?? p.name ?? (source[labelKey] ?? source.name ?? source.status ?? source.priority) ?? `item-${idx}`;
      const color = p.color ?? colors[idx % colors.length];
      return { label, color };
    });
  } else if (Array.isArray(data) && data.length > 0) {
    items = data.map((d, idx) => {
      const label = d[labelKey] ?? d.name ?? d.status ?? d.priority ?? `item-${idx}`;
      const color = colors[idx % colors.length];
      return { label, color };
    });
  } else {
    // nothing to render
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3 mt-3">
      {items.map((it, i) => (
        <div key={`legend-${i}`} className="flex items-center gap-2 text-sm text-gray-700">
          <span
            className="w-3 h-3 rounded-sm inline-block"
            style={{ backgroundColor: it.color ?? "#ccc" }}
          />
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
};

export default CustomLegend;
