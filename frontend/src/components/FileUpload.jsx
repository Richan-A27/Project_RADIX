import { useRef, useState } from "react";
import { ALLOWED_FILE_TYPES } from "../utils/constants";

export default function FileUpload({ onFileSelect, onTextSubmit, disabled }) {
  const [activeTab, setActiveTab] = useState("file");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pastedText, setPastedText] = useState("");
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSetFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(ext)) {
      alert(`Unsupported file type. Allowed: ${ALLOWED_FILE_TYPES.join(", ")}`);
      return;
    }
    setSelectedFile(file);
  };

  const handleAnalyze = () => {
    if (activeTab === "file" && selectedFile) {
      onFileSelect(selectedFile);
    } else if (activeTab === "text" && pastedText.trim()) {
      onTextSubmit(pastedText);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canAnalyze =
    !disabled &&
    ((activeTab === "file" && selectedFile) ||
      (activeTab === "text" && pastedText.trim()));

  return (
    <div className="card">
      <div className="card-title">Upload Job Description</div>

      <div className="input-tabs">
        <button
          className={`input-tab ${activeTab === "file" ? "active" : ""}`}
          onClick={() => setActiveTab("file")}
        >
          📄 File Upload
        </button>
        <button
          className={`input-tab ${activeTab === "text" ? "active" : ""}`}
          onClick={() => setActiveTab("text")}
        >
          📝 Paste Text
        </button>
      </div>

      {activeTab === "file" ? (
        <>
          <div
            className={`upload-zone ${dragOver ? "drag-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-zone-icon">📁</div>
            <div className="upload-zone-title">
              Drop your JD file here or click to browse
            </div>
            <div className="upload-zone-subtitle">
              Supports PDF, DOCX, and TXT files
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          {selectedFile && (
            <div className="upload-file-info">
              <span className="upload-file-name">📎 {selectedFile.name}</span>
              <button className="upload-file-remove" onClick={removeFile}>
                ✕
              </button>
            </div>
          )}
        </>
      ) : (
        <textarea
          className="text-input-area"
          placeholder="Paste the job description text here..."
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
        />
      )}

      <div className="btn-group">
        <button
          className="btn btn-primary"
          onClick={handleAnalyze}
          disabled={!canAnalyze}
        >
          🔍 Analyze JD
        </button>
      </div>
    </div>
  );
}
