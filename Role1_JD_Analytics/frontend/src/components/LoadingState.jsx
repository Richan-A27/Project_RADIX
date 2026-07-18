export default function LoadingState() {
  return (
    <div className="card">
      <div className="loading-container">
        <div className="loading-spinner" />
        <div className="loading-text">Analyzing your Job Description...</div>
        <div className="loading-subtext">
          Extracting skills & mapping to RADIX categories via Gemini AI
        </div>
      </div>
    </div>
  );
}
