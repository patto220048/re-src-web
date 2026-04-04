"use client";

import { useState, useRef } from "react";
import { Upload, X, FileIcon, Loader2 } from "lucide-react";
import styles from "./page.module.css";
import { uploadFile, generateStoragePath } from "../../../lib/storage";
import { addResource } from "../../../lib/firestore";

const CATEGORIES = [
  { slug: "sound-effects", name: "Sound Effects" },
  { slug: "music", name: "Music" },
  { slug: "video-meme", name: "Video Meme" },
  { slug: "green-screen", name: "Green Screen" },
  { slug: "animation", name: "Animation" },
  { slug: "image-overlay", name: "Image & Overlay" },
  { slug: "font", name: "Font" },
  { slug: "preset-lut", name: "Preset & LUT" },
];

export default function NewResource() {
  const [files, setFiles] = useState([]);
  const [category, setCategory] = useState("");
  const [folder, setFolder] = useState("");
  const [tags, setTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length || !category) return;

    setIsUploading(true);
    setProgress(0);

    let completedCount = 0;

    try {
      for (const file of files) {
        const path = generateStoragePath(category, file.name);
        
        const downloadUrl = await uploadFile(file, path);

        const resourceData = {
          name: file.name,
          slug: file.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          category: category,
          folder: folder,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          downloadUrl: downloadUrl,
          storagePath: path,
        };

        await addResource(resourceData);
        
        completedCount++;
        setProgress(Math.round((completedCount / files.length) * 100));
      }

      alert(`Successfully uploaded ${files.length} files!`);
      // Reset form
      setFiles([]);
      setCategory("");
      setFolder("");
      setTags("");
      setProgress(0);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading files: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Add Resources</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Drop zone */}
        <div
          className={styles.dropZone}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          style={{ opacity: isUploading ? 0.5 : 1, pointerEvents: isUploading ? 'none' : 'auto' }}
        >
          <Upload size={32} className={styles.dropIcon} />
          <p>Drag & drop files or click to browse</p>
          <p className={styles.dropHint}>Supports: mp3, wav, mp4, png, ttf, cube...</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
            disabled={isUploading}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className={styles.fileList}>
            {files.map((file, idx) => (
              <div key={idx} className={styles.fileItem}>
                <FileIcon size={16} />
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>
                  {(file.size / 1024).toFixed(0)} KB
                </span>
                <button type="button" className={styles.removeBtn} onClick={() => removeFile(idx)} disabled={isUploading}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Category */}
        <div className={styles.field}>
          <label className={styles.label}>Category *</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} required disabled={isUploading}>
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Folder */}
        <div className={styles.field}>
          <label className={styles.label}>Folder Path</label>
          <input
            type="text"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="e.g. Transition/Whoosh"
            disabled={isUploading}
          />
        </div>

        {/* Tags */}
        <div className={styles.field}>
          <label className={styles.label}>Tags (comma separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="transition, whoosh, fast"
            disabled={isUploading}
          />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={files.length === 0 || isUploading}>
          {isUploading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Uploading... {progress}%
            </>
          ) : (
            <>
              <Upload size={18} />
              Upload {files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""}` : ""}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
