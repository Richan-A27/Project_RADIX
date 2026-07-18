import SkillCard from "./SkillCard";
import { RADIX_CATEGORIES } from "../utils/constants";

export default function AnalysisResult({ data, onReset }) {
  if (!data) return null;

  // Group skills by category
  const grouped = {};
  (data.skills || []).forEach((skill) => {
    const code = skill.category_code || "OTHER";
    if (!grouped[code]) grouped[code] = [];
    grouped[code].push(skill);
  });

  // Sort categories by count (descending)
  const sortedCategories = Object.entries(grouped).sort(
    (a, b) => b[1].length - a[1].length
  );

  const totalSkills = data.skills?.length || 0;
  const categoryCount = sortedCategories.length;

  const handleExport = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `radix_jd_analysis_${data.company || "unknown"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card">
      <div className="result-header">
        <div className="result-meta">
          <h2>
            {data.role || "Unknown Role"} — {data.company || "Unknown Company"}
          </h2>
          <p>📄 {data.source_file}</p>
        </div>
        <div className="result-stats">
          <div className="stat-box">
            <div className="stat-number">{totalSkills}</div>
            <div className="stat-label">Skills Found</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{categoryCount}</div>
            <div className="stat-label">Categories</div>
          </div>
        </div>
      </div>

      {sortedCategories.map(([code, skills]) => {
        const cat = RADIX_CATEGORIES[code] || RADIX_CATEGORIES.OTHER;
        return (
          <div key={code} className="category-section">
            <div className="category-header">
              <span className="category-dot" style={{ background: cat.color }} />
              <span style={{ color: cat.color }}>
                {cat.icon} {cat.label}
              </span>
              <span className="category-count">({skills.length})</span>
            </div>
            <div className="skills-grid">
              {skills.map((skill, i) => (
                <SkillCard key={`${code}-${i}`} skill={skill} />
              ))}
            </div>
          </div>
        );
      })}

      <div className="btn-group">
        <button className="btn btn-primary" onClick={handleExport}>
          📥 Export JSON
        </button>
        <button className="btn btn-secondary" onClick={onReset}>
          🔄 Analyze Another
        </button>
      </div>
    </div>
  );
}
