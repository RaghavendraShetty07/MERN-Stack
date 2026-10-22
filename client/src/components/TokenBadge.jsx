import React from 'react';

const TokenBadge = ({ status }) => {
  const normalized = (status || 'waiting').toLowerCase();

  const labels = {
    waiting: 'In Queue',
    called: 'Called',
    serving: 'Serving Now',
    completed: 'Completed',
    skipped: 'Skipped',
    cancelled: 'Cancelled',
  };

  return (
    <span className={`status-badge ${normalized}`}>
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          display: 'inline-block',
        }}
      />
      {labels[normalized] || status}
    </span>
  );
};

export default TokenBadge;
