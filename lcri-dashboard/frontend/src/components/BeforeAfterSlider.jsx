import React, { useState, useRef, useEffect } from 'react';

export default function BeforeAfterSlider({ beforeImage, afterImage, beforeLabel = 'Before', afterLabel = 'After' }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef(null);

  const handleDrag = (e) => {
    if (!containerRef.current) return;
    const { left, width } = containerRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - left;
    const position = Math.max(0, Math.min(100, (x / width) * 100));
    setSliderPosition(position);
  };

  const startDragging = () => {
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('touchmove', handleDrag);
    window.addEventListener('touchend', stopDragging);
  };

  const stopDragging = () => {
    window.removeEventListener('mousemove', handleDrag);
    window.removeEventListener('mouseup', stopDragging);
    window.removeEventListener('touchmove', handleDrag);
    window.removeEventListener('touchend', stopDragging);
  };

  useEffect(() => {
    return stopDragging;
  }, []);

  return (
    <div 
      className="ba-slider-container"
      ref={containerRef}
      onMouseDown={handleDrag}
      onTouchStart={handleDrag}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '800px',
        height: '450px',
        margin: '0 auto',
        overflow: 'hidden',
        borderRadius: '16px',
        cursor: 'ew-resize',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      {/* After Image (Base) */}
      <img src={afterImage} alt="After" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: 4, color: '#e74c3c', fontWeight: 'bold', fontSize: '0.9rem', backdropFilter: 'blur(4px)' }}>
        {afterLabel}
      </div>

      {/* Before Image (Overlay) */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: `${sliderPosition}%`,
        overflow: 'hidden'
      }}>
        <img src={beforeImage} alt="Before" style={{ width: containerRef.current ? containerRef.current.offsetWidth : 800, height: '100%', objectFit: 'cover', display: 'block', maxWidth: 'none' }} />
        <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: 4, color: '#2ecc71', fontWeight: 'bold', fontSize: '0.9rem', backdropFilter: 'blur(4px)' }}>
          {beforeLabel}
        </div>
      </div>

      {/* Slider Handle */}
      <div style={{
        position: 'absolute',
        top: 0, bottom: 0,
        left: `${sliderPosition}%`,
        width: 4,
        background: '#fff',
        transform: 'translateX(-50%)',
        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
        zIndex: 10
      }}>
        <div 
          onMouseDown={(e) => { e.stopPropagation(); startDragging(); }}
          onTouchStart={(e) => { e.stopPropagation(); startDragging(); }}
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 40, height: 40,
            background: '#fff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            cursor: 'grab'
          }}
        >
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: '8px solid #333' }}></div>
            <div style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '8px solid #333' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
