import React from 'react';
import './AndroidChromeModal.css';

interface AndroidChromeModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

const AndroidChromeModal: React.FC<AndroidChromeModalProps> = ({ isOpen, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="android-modal-overlay">
      <div className="android-modal" onClick={(e) => e.stopPropagation()}>
        <div className="android-modal-header">
          <h2>切換至 Chrome 瀏覽器</h2>
        </div>
        <div className="android-modal-body">
          <p>為了更佳的使用體驗，將為您切換到 Chrome 瀏覽器。</p>
        </div>
        <div className="android-modal-actions">
          <button className="btn-primary" onClick={onConfirm}>前往 Chrome</button>
        </div>
      </div>
    </div>
  );
};

export default AndroidChromeModal;
