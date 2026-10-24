import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  ImageUp,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import ZoomablePhoto from "../ui/ZoomablePhoto";
import type { PhotoChange } from "../../types/user";

// Must match the limits enforced by the backend.
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

interface PhotoPickerProps {
  // The photo currently saved on the server, if any.
  initialImageUrl?: string | null;
  // undefined = keep the saved one, null = remove it, File = upload on save.
  photo: PhotoChange;
  onChange: (photo: PhotoChange) => void;
  // Validation messages (wrong type, too big); null clears them.
  onError: (message: string | null) => void;
}

// Profile photo field: preview, Upload/Change/Remove buttons and a drag &
// drop zone. Nothing is uploaded here; the parent form does that on save.
export default function PhotoPicker({
  initialImageUrl,
  photo,
  onChange,
  onError,
}: PhotoPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local preview of a newly picked file, released when it's replaced.
  const localPreviewUrl = useMemo(
    () => (photo instanceof File ? URL.createObjectURL(photo) : null),
    [photo],
  );
  useEffect(
    () => () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    },
    [localPreviewUrl],
  );
  const previewUrl =
    photo === undefined ? (initialImageUrl ?? null) : localPreviewUrl;

  // Shared by the file picker and drag & drop.
  const acceptPhoto = (file: File) => {
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      onError("Only JPEG, PNG or WebP images are allowed.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      onError("Photo must be 5 MB or smaller.");
      return;
    }
    onError(null);
    onChange(file);
  };

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so picking the same file again still fires onChange.
    e.target.value = "";
    if (file) acceptPhoto(file);
  };

  const handlePhotoRemove = () => {
    // Only ask the backend to delete if there is a saved photo to delete.
    onChange(initialImageUrl ? null : undefined);
  };

  // ---- Drag & drop ----
  const [isDragging, setIsDragging] = useState(false);
  // dragenter/dragleave also fire when moving over child elements, so count
  // them instead of toggling, or the highlight flickers.
  const dragDepth = useRef(0);

  const hasFiles = (e: React.DragEvent) => e.dataTransfer.types.includes("Files");

  const handleDragEnter = (e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth.current++;
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    // Required, or the browser won't allow dropping here.
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) acceptPhoto(file);
  };

  // A file dropped anywhere else on the page would make the browser open it
  // and leave the form, losing what was typed.
  useEffect(() => {
    const blockFileDrop = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("Files")) e.preventDefault();
    };
    window.addEventListener("dragover", blockFileDrop);
    window.addEventListener("drop", blockFileDrop);
    return () => {
      window.removeEventListener("dragover", blockFileDrop);
      window.removeEventListener("drop", blockFileDrop);
    };
  }, []);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex items-center gap-4 p-3 rounded-xl border-2 border-dashed transition-colors ${
        isDragging
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
          : "border-slate-200 dark:border-line-strong"
      }`}
    >
      {isDragging && (
        // pointer-events-none so the drag events keep reaching the zone.
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/80 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
          <ImageUp size={18} />
          Drop photo to upload
        </div>
      )}
      <div className="w-20 h-20 shrink-0 rounded-full overflow-hidden bg-slate-100 dark:bg-subtle border border-slate-200 dark:border-line-strong flex items-center justify-center">
        {previewUrl ? (
          <ZoomablePhoto src={previewUrl} alt="Profile photo" />
        ) : (
          <UserIcon size={32} className="text-fg-3 dark:text-white0" />
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/70 rounded-2xl transition-colors"
          >
            <Camera size={14} />
            {previewUrl ? "Change Photo" : "Upload Photo"}
          </button>
          {previewUrl && (
            <button
              type="button"
              onClick={handlePhotoRemove}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-2xl transition-colors"
            >
              <Trash2 size={14} />
              Remove
            </button>
          )}
        </div>
        <p className="text-xs text-fg-3 dark:text-white0">
          Or drag & drop a photo here. JPEG, PNG or WebP, up to 5 MB
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_PHOTO_TYPES.join(",")}
        className="hidden"
        onChange={handlePhotoSelected}
      />
    </div>
  );
}
