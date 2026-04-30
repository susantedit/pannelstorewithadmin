import { useEffect, useState } from 'react';

export function Countdown({ seconds, onComplete, label = '', variant = 'default' }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remaining, onComplete]);

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const percentage = Math.max(0, (remaining / seconds) * 100);

  return (
    <div className={`countdown countdown-${variant}`}>
      {label && <div className="countdown-label">{label}</div>}
      <div className="countdown-display">
        <svg className="countdown-ring" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" className="countdown-ring-bg" />
          <circle
            cx="50"
            cy="50"
            r="45"
            className="countdown-ring-progress"
            style={{
              strokeDashoffset: 282.7 * (1 - percentage / 100)
            }}
          />
        </svg>
        <div className="countdown-time">{formatted}</div>
      </div>
    </div>
  );
}
