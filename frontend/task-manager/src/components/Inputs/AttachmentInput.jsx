import React, { useState } from "react";
import { LuLink2, LuExternalLink, LuX } from "react-icons/lu";

const AttachmentsInput = ({ attachments = [], onChange }) => {
  const [input, setInput] = useState("");

  const normalizeUrl = (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleAdd = () => {
    const normalized = normalizeUrl(input);
    if (!normalized) return;

    const next = [...attachments, normalized];
    onChange(next);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (index) => {
    const next = attachments.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div className="mt-4">
      {/* Label */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
          <LuLink2 className="text-slate-500" />
          Attachments (Links)
        </label>

        {attachments?.length > 0 && (
          <span className="text-[11px] text-slate-400">
            {attachments.length} link{attachments.length > 1 ? "s" : ""} added
          </span>
        )}
      </div>

      {/* Input row */}
      <div className=" mt-6 w-xs">
        <input
          type="text"
          className="form-input flex-1"
          placeholder="Paste a link (e.g. https://drive.google.com/...)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="btn-primary text-xs sm:w-auto w-full flex items-center justify-center gap-1"
        >
          <LuLink2 className="text-sm" />
          Add
        </button>
      </div>

      {/* Helper text */}
      <p className="mt-1 text-[11px] text-slate-400">Upload Links.
      </p>

      {/* Attachments list */}
      <div className="mt-2 flex flex-wrap gap-2">
        {(!attachments || attachments.length === 0) && (
          <span className="text-[11px] text-slate-400">
            No attachments added
          </span>
        )}

        {attachments?.map((url, idx) => {
          // Short label for display
          let display = url.replace(/^https?:\/\//i, "");
          if (display.length > 40) display = display.slice(0, 37) + "...";

          return (
            <div
              key={`${url}-${idx}`}
              className="inline-flex items-center max-w-full rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700 shadow-sm"
            >
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 max-w-[180px]"
                title={url}
              >
                <LuExternalLink className="text-slate-500 min-w-3" />
                <span className="truncate">{display}</span>
              </a>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-50 text-[10px] text-rose-500 hover:bg-rose-100 hover:text-rose-600"
                title="Remove attachment"
              >
                <LuX className="text-[11px]" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttachmentsInput;
