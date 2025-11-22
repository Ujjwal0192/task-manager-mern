import React, { useEffect, useMemo, useRef, useState } from "react";

const SelectDropdownAdvanced = ({
  options = [],
  value = [],
  onChange = () => {},
  multi = false,
  searchable = false,
  placeholder = "Select...",
}) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // Normalize options: ensure label & value are strings
  const normalizedOptions = useMemo(
    () =>
      options.map((opt) => ({
        ...opt,
        label: (opt.label ?? "").toString(),
        value:
          opt.value === undefined || opt.value === null
            ? ""
            : String(opt.value),
      })),
    [options]
  );

  // Normalize value into array of string values
  const normalizedValueArray = useMemo(() => {
    if (value === undefined || value === null) return [];
    if (Array.isArray(value)) {
      return value.map((v) =>
        v === undefined || v === null ? "" : String(v)
      );
    }
    return [String(value)];
  }, [value]);

  // Filter options when searching
  const filteredOptions = useMemo(() => {
    if (!searchable || !search.trim()) return normalizedOptions;
    const s = search.toLowerCase();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(s)
    );
  }, [normalizedOptions, search, searchable]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const toggleSelect = (val) => {
    if (multi) {
      const exists = normalizedValueArray.includes(val);
      const next = exists
        ? normalizedValueArray.filter((v) => v !== val)
        : [...normalizedValueArray, val];
      onChange(next);
    } else {
      onChange(val);
      setOpen(false);
    }
  };

  const getLabel = () => {
    if (!normalizedValueArray || normalizedValueArray.length === 0) {
      return placeholder;
    }
    const selected = normalizedOptions.filter((opt) =>
      normalizedValueArray.includes(opt.value)
    );
    if (multi) {
      if (selected.length === 0) return placeholder;
      if (selected.length <= 2) {
        return selected.map((s) => s.label).join(", ");
      }
      return `${selected.length} selected`;
    }
    return selected[0]?.label ?? placeholder;
  };

  return (
    <div className="relative w-full text-sm" ref={rootRef}>
      {/* Trigger */}
      <div
        className="border p-2 rounded cursor-pointer bg-white shadow-sm flex items-center justify-between"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="truncate text-slate-700">
          {getLabel()}
        </div>
        <div className="ml-2 text-xs text-slate-500">{open ? "▲" : "▼"}</div>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 w-full bg-white border rounded mt-1 shadow max-h-56 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {searchable && (
            <div className="p-2 border-b">
              <input
                type="text"
                className="w-full p-2 outline-none text-sm border rounded"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 && (
              <div className="p-2 text-slate-500 text-xs">
                No results
              </div>
            )}

            {filteredOptions.map((opt) => {
              const selected = normalizedValueArray.includes(opt.value);
              return (
                <div
                  key={opt.value || opt.label}
                  className={`p-2 cursor-pointer hover:bg-slate-100 flex items-center justify-between ${
                    selected ? "bg-slate-200" : ""
                  }`}
                  onClick={() => toggleSelect(opt.value)}
                >
                  <div className="flex items-center gap-2">
                    {opt.icon &&
                      (typeof opt.icon === "string" ? (
                        <img
                          src={opt.icon}
                          alt={opt.label}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <span className="w-6 h-6">{opt.icon}</span>
                      ))}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {selected && <span className="text-sm">✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectDropdownAdvanced;
