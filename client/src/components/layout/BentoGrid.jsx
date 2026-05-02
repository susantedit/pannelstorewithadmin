import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Zap, Shield, Globe, Crown } from 'lucide-react';
import EarthGlobe from '../3d/EarthGlobe';

export default function BentoGrid() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="bento-container" 
      style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gridAutoRows: '200px',
        gap: '16px',
        margin: '80px 0'
      }}
    >
      {/* 3D Global Reach (2x2) */}
      <motion.div 
        variants={itemVariants}
        whileHover={{ y: -5 }}
        className="glass-card"
        style={{ gridColumn: 'span 2', gridRow: 'span 2', borderRadius: '32px', overflow: 'hidden', position: 'relative' }}
      >
        <div style={{ padding: '32px', position: 'relative', zIndex: 1 }}>
          <div className="eyebrow" style={{ color: '#34d399' }}><Globe size={14} /> Nodes Online</div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '12px' }}>GLOBAL<br/>DOMINANCE</h3>
        </div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '100%', height: '100%' }}>
          <EarthGlobe width={400} height={400} />
        </div>
      </motion.div>

      {/* 3D Calendar / Events (2x1) */}
      <motion.div 
        variants={itemVariants}
        whileHover={{ y: -5 }}
        className="glass-card"
        style={{ gridColumn: 'span 2', gridRow: 'span 1', borderRadius: '32px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}
      >
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '16px', background: 'var(--primary-soft)', 
          display: 'grid', placeItems: 'center', flexShrink: 0 
        }}>
          <Calendar size={32} color="var(--primary)" />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.1rem' }}>LIVE DROPS</h4>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>Next scheduled batch in 2h 45m</p>
        </div>
      </motion.div>

      {/* Instant Zap (1x1) */}
      <motion.div 
        variants={itemVariants}
        whileHover={{ scale: 1.05 }}
        className="glass-card"
        style={{ borderRadius: '32px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}
      >
        <Zap size={32} color="#fbbf24" style={{ marginBottom: '12px' }} />
        <span style={{ fontWeight: 800 }}>INSTANT</span>
      </motion.div>

      {/* Secure Shield (1x1) */}
      <motion.div 
        variants={itemVariants}
        whileHover={{ scale: 1.05 }}
        className="glass-card"
        style={{ borderRadius: '32px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}
      >
        <Shield size={32} color="#4ade80" style={{ marginBottom: '12px' }} />
        <span style={{ fontWeight: 800 }}>SECURE</span>
      </motion.div>

      {/* Elite Stats (4x1) */}
      <motion.div 
        variants={itemVariants}
        whileHover={{ y: -5 }}
        className="glass-card"
        style={{ gridColumn: 'span 4', gridRow: 'span 1', borderRadius: '32px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 40px' }}
      >
        {[
          { label: 'PLAYERS', val: '10K+' },
          { label: 'ORDERS', val: '50K+' },
          { label: 'RATING', val: '4.9' },
          { label: 'UPTIME', val: '99.9%' }
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>{s.val}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', letterSpacing: '2px' }}>{s.label}</div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
