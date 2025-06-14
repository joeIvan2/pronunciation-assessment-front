import React, { useEffect, useRef, useState } from 'react';

interface RandomDraggableButtonProps {
  onRandom: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
}

const RandomDraggableButton: React.FC<RandomDraggableButtonProps> = ({ onRandom, onStopRecording, isRecording }) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 40, y: 40 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // 拖放邏輯
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      setPosition({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };
    const handleMouseUp = () => setDragging(false);
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, offset]);

  // 鍵盤快捷鍵
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'NumpadEnter' || e.code === 'Enter') {
        if (isRecording) {
          onStopRecording();
        } else {
          onRandom();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, onRandom, onStopRecording]);

  return (
    <div
      ref={buttonRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        background: isRecording ? '#d9534f' : '#007bff',
        color: '#fff',
        borderRadius: 24,
        padding: '12px 20px',
        fontWeight: 700,
        fontSize: 18,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        transition: 'background 0.2s',
      }}
      onMouseDown={e => {
        if (e.button === 0) {
          setDragging(true);
          const rect = buttonRef.current?.getBoundingClientRect();
          setOffset({ x: e.clientX - (rect?.left || 0), y: e.clientY - (rect?.top || 0) });
        }
      }}
      onClick={e => {
        if (!dragging) {
          if (isRecording) {
            onStopRecording();
          } else {
            onRandom();
          }
        }
      }}
    >
      {isRecording ? '■ 停止錄音 (Enter)' : '🎲 隨機 (Enter)'}
    </div>
  );
};

export default RandomDraggableButton; 