import React from 'react';

interface ErrorTypeTagProps {
  type?: string;
  style?: React.CSSProperties;
}

const ErrorTypeTag: React.FC<ErrorTypeTagProps> = ({ type, style }) => {
  if (!type || type === "None") return null;
  
  const color = {
    Mispronunciation: "#e53935",
    Omission: "#ffb300",
    Insertion: "#1e88e5",
    "UnexpectedBreak": "#8e24aa",
    "MissingBreak": "#fbc02d"
  }[type] || "#757575";
  
  return (
    <span style={{
      background: color,
      color: "#fff",
      borderRadius: 4,
      padding: "2px 6px",
      marginLeft: 6,
      fontSize: 12,
      ...style
    }}>
      {type}
    </span>
  );
}

export default ErrorTypeTag; 