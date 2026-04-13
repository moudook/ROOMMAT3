import React from 'react';
import './CyberCallout.css';

const CyberCallout = ({ title, text, top, left, right, bottom, variant, delay = 0, show = false }) => {
  return (
    <div 
      className={`cyber-callout ${variant} ${show ? 'show' : ''}`} 
      style={{ 
        top, left, right, bottom,
        '--animation-delay': `calc(3s + ${delay}s)`
      }}
    >
      <div className="callout-content">
        <h4 className="callout-title">{title}</h4>
        <p className="callout-text">{text}</p>
      </div>
      <div className="callout-path">
        <div className="line-horizontal"></div>
        <div className="line-angled">
          <div className="callout-dot"></div>
        </div>
      </div>
    </div>
  );
};

export default CyberCallout;
