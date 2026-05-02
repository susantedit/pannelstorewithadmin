import React from 'react';
import { motion } from 'framer-motion';

export function Input({ label, placeholder, type = 'text', required = false, error, icon, ...props }) {
  return (
    <div className="form-group" style={{ marginBottom: '20px', position: 'relative' }}>
      {label && (
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontSize: '0.75rem', 
          fontWeight: 700, 
          color: 'var(--muted)', 
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          {label}
          {required && <span style={{ color: 'var(--primary)', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--muted)',
            pointerEvents: 'none',
            zIndex: 1
          }}>
            {icon}
          </div>
        )}
        
        <input
          type={type}
          placeholder={placeholder}
          className={`form-input ${error ? 'error' : ''}`}
          style={{
            width: '100%',
            padding: `12px 16px 12px ${icon ? '40px' : '16px'}`,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '0.9rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            outline: 'none',
            ...(error ? { borderColor: 'rgba(230, 57, 70, 0.5)', background: 'rgba(230, 57, 70, 0.05)' } : {})
          }}
          {...props}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--primary)';
            e.target.style.boxShadow = '0 0 15px rgba(230, 57, 70, 0.2), inset 0 0 10px rgba(230, 57, 70, 0.1)';
            e.target.style.background = 'rgba(230, 57, 70, 0.02)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.target.style.boxShadow = 'none';
            e.target.style.background = 'rgba(255, 255, 255, 0.03)';
          }}
        />
      </div>
      
      {error && (
        <motion.span 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '6px', display: 'block' }}
        >
          {error}
        </motion.span>
      )}
    </div>
  );
}
