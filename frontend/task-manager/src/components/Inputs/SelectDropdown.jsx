import React, { useEffect, useRef, useState } from "react";
import { HiOutlineSelector, HiX, HiOutlineSearch } from "react-icons/hi";



const defaultToString = (opt) => (opt && opt.label) || String(opt || "");

const SelectDropdown = ({
  options = [],
  value,
  onChange = () => {},
  placeholder = "Select...",
  multi = false,
  searchable = true,
  disabled = false,
  className = "",
  noResultsText = "No results",
}) => {
  const isControlled = value !== undefined;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // internal state when uncontrolled
  const [internalSingle, setInternalSingle] = useState(null);
  const [internalMulti, setInternalMulti] = useState([]);

  // selected values normalized
  const selected = multi
    ? (isControlled ? (value || []) : internalMulti)
    : (isControlled ? value : internalSingle);

  // filter options
  const filtered = options.filter((opt) =>
    defaultToString(opt).toLowerCase().includes(query.trim().toLowerCase())
  );

  useEffect(() => {
    // close on outside click
    const onDocClick = (e) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
        setHighlightIndex(0);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    // reset highlight when filtered changes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighlightIndex((idx) => {
      if (filtered.length === 0) return 0;
      return Math.min(idx, filtered.length - 1);
    });
  }, [query, options.length, filtered.length]);

  // helpers
  const isSelected = (opt) => {
    if (multi) {
      return Array.isArray(selected) && selected.some((v) => v === opt.value);
    }
    return selected === opt.value;
  };

  const selectSingle = (opt) => {
    if (disabled) return;
    if (isControlled) {
      onChange(opt.value);
    } else {
      setInternalSingle(opt.value);
      onChange(opt.value);
    }
    setOpen(false);
    setQuery("");
  };

  const toggleMulti = (opt) => {
    if (disabled) return;
    const cur = Array.isArray(selected) ? [...selected] : [];
    const idx = cur.indexOf(opt.value);
    if (idx > -1) {
      cur.splice(idx, 1);
    } else {
      cur.push(opt.value);
    }
    if (isControlled) {
      onChange(cur);
    } else {
      setInternalMulti(cur);
      onChange(cur);
    }
    // keep dropdown open for quicker multiple picks
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 0);
  };

  const removeMultiValue = (val) => {
    if (disabled) return;
    const cur = Array.isArray(selected) ? [...selected] : [];
    const idx = cur.indexOf(val);
    if (idx > -1) cur.splice(idx, 1);
    if (isControlled) onChange(cur);
    else setInternalMulti(cur);
  };

  // keyboard handlers
  const onKeyDown = (e) => {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setOpen(true);
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        scrollIntoView(highlightIndex + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        setOpen(true);
        setHighlightIndex((i) => Math.max(i - 1, 0));
        scrollIntoView(highlightIndex - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        if (filtered[highlightIndex]) {
          const opt = filtered[highlightIndex];
          multi ? toggleMulti(opt) : selectSingle(opt);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setQuery("");
        break;
      default:
        break;
    }
  };

  const scrollIntoView = (index) => {
    // ensure highlighted item is visible
    const list = listRef.current;
    if (!list) return;
    const child = list.children[index];
    if (child) {
      const listRect = list.getBoundingClientRect();
      const childRect = child.getBoundingClientRect();
      if (childRect.top < listRect.top) child.scrollIntoView({ block: "nearest" });
      else if (childRect.bottom > listRect.bottom) child.scrollIntoView({ block: "nearest" });
    }
  };

  // UI render helpers
  const renderValue = () => {
    if (multi) {
      const vals = Array.isArray(selected) ? selected : [];
      if (!vals.length) return <span className="text-gray-400">{placeholder}</span>;
      return (
        <div className="flex gap-2 flex-wrap">
          {vals.map((val) => {
            const opt = options.find((o) => o.value === val);
            return (
              <span
                key={val}
                className="flex items-center gap-1 bg-gray-100 text-xs text-gray-800 px-2 py-1 rounded-full"
              >
                {opt?.icon && <span className="mr-1">{opt.icon}</span>}
                <span>{opt ? opt.label : String(val)}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMultiValue(val);
                  }}
                  className="ml-1 text-gray-400 hover:text-gray-600"
                  aria-label={`Remove ${opt?.label || val}`}
                >
                  <HiX className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      );
    } else {
      if (selected === null || selected === undefined || selected === "") {
        return <span className="text-gray-400">{placeholder}</span>;
      }
      const opt = options.find((o) => o.value === selected);
      return (
        <div className="flex items-center gap-2">
          {opt?.icon && <span>{opt.icon}</span>}
          <span>{opt ? opt.label : String(selected)}</span>
        </div>
      );
    }
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <div
        role="combobox"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
          if (!open && inputRef.current) {
            setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
          }
        }}
        className={`w-full border rounded-md px-3 py-2 flex items-center justify-between gap-2 cursor-pointer ${
          disabled ? "bg-gray-50 cursor-not-allowed text-gray-400" : "bg-white"
        }`}
      >
        <div className="flex-1 min-w-0">
          {searchable ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                {/* display selected chips or single value */}
                <div className="min-h-[1.1rem]">{renderValue()}</div>
              </div>

              <div className="flex items-center gap-2">
                <HiOutlineSelector className="w-5 h-5 text-gray-500" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">{renderValue()}</div>
              <HiOutlineSelector className="w-5 h-5 text-gray-500" />
            </div>
          )}
        </div>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white border rounded-md shadow-lg">
          {/* search input */}
          {searchable && (
            <div className="flex items-center gap-2 px-3 py-2 border-b">
              <HiOutlineSearch className="w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlightIndex(0);
                }}
                className="flex-1 text-sm outline-none"
                placeholder="Search..."
                autoFocus
                onKeyDown={(e) => {
                  // allow navigation when typing
                  if (["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) {
                    onKeyDown(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current && inputRef.current.focus();
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <HiX className="w-4 h-4" />
              </button>
            </div>
          )}

          <ul
            ref={listRef}
            role="listbox"
            aria-activedescendant={`option-${highlightIndex}`}
            tabIndex={-1}
            className="max-h-56 overflow-auto p-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">{noResultsText}</li>
            ) : (
              filtered.map((opt, idx) => {
                const selectedFlag = isSelected(opt);
                const highlighted = idx === highlightIndex;
                return (
                  <li
                    id={`option-${idx}`}
                    key={opt.value}
                    role="option"
                    aria-selected={selectedFlag}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    onMouseDown={(e) => {
                      // prevent blur
                      e.preventDefault();
                    }}
                    onClick={() => {
                      multi ? toggleMulti(opt) : selectSingle(opt);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-sm ${
                      highlighted ? "bg-gray-100" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* show checkbox-like marker for multi or selected marker for single */}
                      {multi ? (
                        <input type="checkbox" readOnly checked={selectedFlag} className="w-4 h-4" />
                      ) : (
                        selectedFlag && <span className="text-sm text-primary">Selected</span>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SelectDropdown;
