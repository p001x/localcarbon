import { useState } from 'react'

export default function InfoTooltip({ text }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div 
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '6px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={{ 
        cursor: 'help', 
        fontSize: '0.9rem',
        color: 'var(--accent)',
        opacity: 0.8
      }}>
        ℹ️
      </span>
      
      {isHovered && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
          backgroundColor: '#0a1a0d',
          border: '1px solid var(--border)',
          color: 'var(--text-sec)',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '0.75rem',
          whiteSpace: 'normal',
          width: 'max-content',
          maxWidth: '250px',
          zIndex: 1000,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
          lineHeight: 1.4,
          fontWeight: 'normal',
          textTransform: 'none'
        }}>
          {text}
          {/* Tooltip arrow */}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            borderWidth: '5px',
            borderStyle: 'solid',
            borderColor: '#0a1a0d transparent transparent transparent',
          }} />
        </div>
      )}
    </div>
  )
}
