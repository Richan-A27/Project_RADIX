import { useState } from "react";
import { RADIX_CATEGORIES } from "../utils/constants";

export default function SkillCard({ skill }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const cat = RADIX_CATEGORIES[skill.category_code] || RADIX_CATEGORIES.OTHER;

  return (
    <div
      className="skill-badge"
      style={{
        background: `${cat.color}12`,
        borderColor: `${cat.color}30`,
        color: cat.color,
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className={`confidence-dot ${skill.confidence}`} />
      {skill.skill_name}
      {showTooltip && (
        <div className="skill-tooltip">
          <strong>{skill.skill_name}</strong>
          &quot;{skill.evidence}&quot;
          <br />
          <span style={{ opacity: 0.6 }}>Confidence: {skill.confidence}</span>
        </div>
      )}
    </div>
  );
}
