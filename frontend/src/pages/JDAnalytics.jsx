import { useState } from "react";
import Header from "./components/Header";
import FileUpload from "./components/FileUpload";
import AnalysisResult from "./components/AnalysisResult";
import LoadingState from "./components/LoadingState";
import { analyzeJDFile, analyzeJDText } from "./services/api";
import "./index.css";

function JDAnalytics() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = async (file) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await analyzeJDFile(file);
      setResult(response.data);
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || "Analysis failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = async (text) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await analyzeJDText(text);
      setResult(response.data);
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || "Analysis failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="app-container">
      <Header />

      {error && (
        <div className="error-box">
          <strong>Error: </strong>
          {error}
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : result ? (
        <AnalysisResult data={result} onReset={handleReset} />
      ) : (
        <FileUpload
          onFileSelect={handleFileUpload}
          onTextSubmit={handleTextSubmit}
          disabled={loading}
        />
      )}
    </div>
  );
}

export default JDAnalytics;
