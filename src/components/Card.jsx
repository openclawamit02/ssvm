import React from 'react';
import './Card.css';

const Card = ({ children, className = '', padding = '24px' }) => {
  return (
    <div className={`card ${className}`} style={{ padding }}>
      {children}
    </div>
  );
};

export default Card;
