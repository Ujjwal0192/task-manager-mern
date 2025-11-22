import React, { useRef, useState, useEffect } from "react";
import { LuUser, LuUpload, LuTrash } from "react-icons/lu";

const ProfilePhotoSelecter = ({ image, setImage }) => {
  const inputRef = useRef(null);
  const objectUrlRef = useRef(null);

  // previewUrl: either string from parent or object URL we created
  const [previewUrl, setPreviewUrl] = useState(
    typeof image === "string" && image ? image : null
  );

  // modal open state for zoom view
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // sync when parent changes `image` (only when actually changed)
  useEffect(() => {
    // if parent gave a string URL, use it
    if (typeof image === "string" && image) {
      // revoke any object URL we previously made
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setPreviewUrl(image);
      return;
    }

    // if parent cleared image
    if (!image) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setPreviewUrl(null);
      return;
    }

    // if parent passed a File (rare), create an object URL once
    if (image instanceof File) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const url = URL.createObjectURL(image);
      objectUrlRef.current = url;
      setPreviewUrl(url);
    }
  }, [image]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  // handle file selection: create object URL and inform parent
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // inform parent
    setImage(file);

    // revoke prev object URL and create a new one
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreviewUrl(url);
  };

  const handleRemoveImage = () => {
    setImage(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const chooseFile = () => inputRef.current?.click();

  // open zoom modal
  const openZoom = () => {
    if (!previewUrl) return;
    setIsZoomOpen(true);
    // prevent background scroll
    document.body.style.overflow = "hidden";
  };

  // close zoom modal
  const closeZoom = () => {
    setIsZoomOpen(false);
    document.body.style.overflow = "";
  };

  // close on Esc
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && isZoomOpen) closeZoom();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isZoomOpen]);

  return (
    <>
      <div className="relative w-32 h-32">
        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          ref={inputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        {/* Circle profile photo (click to zoom) */}
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Profile"
            onClick={openZoom}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && openZoom()}
            className="w-full h-full rounded-full object-cover border cursor-pointer"
          />
        ) : (
          <div
            className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center cursor-pointer"
            onClick={chooseFile}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && chooseFile()}
          >
            <LuUser className="text-5xl text-gray-500" />
          </div>
        )}

        {/* Upload Button Bottom-Right */}
        <button
          type="button"
          onClick={chooseFile}
          className="absolute bottom-1 right-1 bg-white shadow-md rounded-full p-2 text-black hover:scale-105 transition"
          aria-label="Upload/change profile photo"
        >
          <LuUpload size={18} />
        </button>

        {/* Remove Button Top-Right */}
        {previewUrl && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
            aria-label="Remove profile photo"
          >
            <LuTrash size={14} />
          </button>
        )}
      </div>

      {/* Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeZoom} // clicking overlay closes
          aria-modal="true"
          role="dialog"
        >
          {/* container to stop propagation when clicking the image/card itself */}
          <div
            className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeZoom}
              className="absolute top-11 right-0 md:top-0 md:right-11 bg-black/60 text-white rounded-full p-2"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Zoomed image */}
            <img
              src={previewUrl}
              alt="Zoomed profile"
              className="max-w-full max-h-full rounded-md shadow-lg object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePhotoSelecter;
