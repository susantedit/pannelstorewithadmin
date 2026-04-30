import { useEffect, useState, useRef } from 'react';
import { playKillFeedPop } from '../../utils/sounds';

const NEPALI_NAMES = [
  'Aarav_GG', 'Sujal_X', 'Priya99', 'Rohan_NP', 'Anisha_K',
  'Bikash_Pro', 'Nisha_Fire', 'Dipesh_YT', 'Samira_NP', 'Kiran_GG',
  'Rajan_X', 'Sunita_Pro', 'Anil_Gamer', 'Puja_NP', 'Suresh_YT',
  'Manisha_K', 'Nabin_Fire', 'Sita_GG', 'Ramesh_X', 'Binita_Pro'
];

const PRODUCTS = [
  'IOS FLUORITE', 'WEEKLY LITE', 'WEEKLY PASS', 'MONTHLY PASS',
  'DIAMOND PACK', 'ELITE PASS', 'ROYAL PASS', 'BATTLE PASS',
  'STARTER PACK', 'LEGEND PACK'
];

const EMOJIS = ['⚡', '🔥', '💎', '🎯', '⚔️', '🏆', '💥', '🎮'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMessage() {
  const name = getRandomItem(NEPALI_NAMES);
  const product = getRandomItem(PRODUCTS);
  const emoji = getRandomItem(EMOJIS);
  return `[${name}] just secured [${product}] ${emoji}`;
}

export default function KillFeed() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);
  const fadeRef = useRef(null);

  const showNext = () => {
    setMessage(generateMessage());
    setVisible(true);
    playKillFeedPop();

    // Fade out after 3s
    fadeRef.current = setTimeout(() => {
      setVisible(false);
    }, 3000);
  };

  useEffect(() => {
    // Initial delay before first message
    const initial = setTimeout(() => {
      showNext();
      // Then repeat every 4-6 seconds
      timerRef.current = setInterval(() => {
        showNext();
      }, 4000 + Math.random() * 2000);
    }, 2000);

    return () => {
      clearTimeout(initial);
      clearInterval(timerRef.current);
      clearTimeout(fadeRef.current);
    };
  }, []);

  if (!message) return null;

  return (
    <>
      <style>{`
        @keyframes killfeed-slide-in {
          from { transform: translateX(-110%); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        @keyframes killfeed-fade-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        .killfeed-ticker {
          position: fixed;
          bottom: 24px;
          left: 20px;
          z-index: 9999;
          pointer-events: none;
        }
        .killfeed-message {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(10, 10, 10, 0.92);
          border: 1px solid rgba(230, 57, 70, 0.5);
          border-left: 3px solid var(--primary);
          border-radius: 8px;
          padding: 10px 16px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          color: #f0f0f0;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.6), 0 0 12px rgba(230,57,70,0.15);
          max-width: 340px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .killfeed-message.entering {
          animation: killfeed-slide-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .killfeed-message.leaving {
          animation: killfeed-fade-out 0.5s ease forwards;
        }
        .killfeed-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--primary);
          flex-shrink: 0;
          box-shadow: 0 0 6px var(--primary);
          animation: pulse-dot 1.2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.7); }
        }
        .killfeed-label {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.6rem;
          color: var(--primary);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-right: 4px;
          flex-shrink: 0;
        }
      `}</style>
      <div className="killfeed-ticker">
        <div className={`killfeed-message ${visible ? 'entering' : 'leaving'}`}>
          <span className="killfeed-dot" />
          <span className="killfeed-label">LIVE</span>
          <span>{message}</span>
        </div>
      </div>
    </>
  );
}
