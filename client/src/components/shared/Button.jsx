import React from 'react';
import { motion } from 'framer-motion';

export function Button({ children, variant = 'ghost', className = '', disabled = false, ...props }) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`button button-${variant} ${disabled ? 'disabled' : ''} ${className}`}
      disabled={disabled}
      {...props}
      style={{
        ...props.style,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        {children}
      </span>
      
      {/* Hover Shine Effect */}
      {!disabled && (
        <motion.div
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            zIndex: 0
          }}
        />
      )}
    </motion.button>
  );
}
