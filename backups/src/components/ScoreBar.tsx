import React from 'react';

interface ScoreBarProps {
  label: string;
  value: number;
  max?: number;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ label, value, max = 100 }) => {
  return (
    <div style={{ margin: "8px 0" }}>
      <div style={{ fontWeight: "bold", color: "#fff" }}>{label}: {value}</div>
      <div style={{ background: "#333", borderRadius: 4, height: 12 }}>
        <div style={{
          width: `${(value / max) * 100}%`,
          background: "#4caf50",
          height: "100%",
          borderRadius: 4
        }} />
      </div>
    </div>
  );
}

export default ScoreBar; 