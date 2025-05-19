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
      borderRadius: 8,
      padding: "2px 6px",
      margin: "2px",
      display: "inline-block",
      fontSize: 11,
      fontWeight: 500,
      lineHeight: 1.2,
      maxWidth: '70px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      ...style
    }}>
      {type}
    </span>
  );
}

export default ErrorTypeTag; 