import React from 'react';
import '../styles/InfoTooltip.css';

interface InfoTooltipProps {
  message: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ message }) => (
  <span className="info-tooltip" title={message}>
    <i className="fas fa-question-circle" />
  </span>
);

export default InfoTooltip;
