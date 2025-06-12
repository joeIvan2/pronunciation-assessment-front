import React from 'react';
import './IOSFacebookModal.css';

interface IOSFacebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const IOSFacebookModal: React.FC<IOSFacebookModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="ios-facebook-modal-overlay">
      <div className="ios-facebook-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ios-facebook-modal-header">
          <h2>🔍  為了達到最好的瀏覽效果</h2>
        </div>
        <div className="ios-facebook-modal-body">
          <p>請點擊右下角的<strong>三個橫點按鈕（⋯）</strong>，選擇「在瀏覽器中開啟」或「在 Safari 中開啟」</p>
        </div>

      </div>
    </div>
  );
};

export default IOSFacebookModal; 