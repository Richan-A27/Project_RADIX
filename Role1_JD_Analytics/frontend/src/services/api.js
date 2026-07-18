/**
 * API service layer — communicates with the FastAPI backend.
 */
import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 min — LLM can take time
});

/**
 * Upload a JD file for analysis.
 * @param {File} file - The PDF, DOCX, or TXT file to analyze
 * @returns {Promise} The analysis result
 */
export async function analyzeJDFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/api/v1/jd/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

/**
 * Analyze pasted text as a JD.
 * @param {string} text - The raw JD text
 * @param {string} sourceName - Optional label for the source
 * @returns {Promise} The analysis result
 */
export async function analyzeJDText(text, sourceName = "pasted_text.txt") {
  const response = await api.post("/api/v1/jd/analyze-text", {
    text,
    source_name: sourceName,
  });
  return response.data;
}

/**
 * Fetch all past analyses.
 * @returns {Promise} List of analyses
 */
export async function getAnalyses() {
  const response = await api.get("/api/v1/jd/analyses");
  return response.data;
}

/**
 * Fetch a single analysis by ID.
 * @param {string} id
 * @returns {Promise} The analysis data
 */
export async function getAnalysisById(id) {
  const response = await api.get(`/api/v1/jd/analyses/${id}`);
  return response.data;
}
