import React, { useState, useEffect } from 'react';
import '../styles/PronunciationAssessment.css';

interface FirestoreErrorHandlerProps {
  children: React.ReactNode;
}

interface ErrorInfo {
  hasError: boolean;
  errorType: 'blocked_by_client' | 'network' | 'other' | null;
  errorMessage: string;
  retryCount: number;
}

const FirestoreErrorHandler: React.FC<FirestoreErrorHandlerProps> = ({ children }) => {
  const [errorInfo, setErrorInfo] = useState<ErrorInfo>({
    hasError: false,
    errorType: null,
    errorMessage: '',
    retryCount: 0
  });

  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  useEffect(() => {
    // 監聽全域錯誤
    const handleGlobalError = (event: ErrorEvent) => {
      const errorMessage = event.message || event.error?.message || '';
      
      if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || 
          errorMessage.includes('net::ERR_BLOCKED_BY_CLIENT')) {
        setErrorInfo({
          hasError: true,
          errorType: 'blocked_by_client',
          errorMessage: '網絡請求被攔截',
          retryCount: 0
        });
      }
    };

    // 監聽未處理的 Promise 拒絕
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const errorMessage = typeof reason === 'string' ? reason : 
                          reason?.message || reason?.toString() || '';
      
      if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT') ||
          errorMessage.includes('firestore') && errorMessage.includes('blocked')) {
        setErrorInfo({
          hasError: true,
          errorType: 'blocked_by_client',
          errorMessage: 'Firestore 連接被攔截',
          retryCount: 0
        });
        
        // 防止錯誤冒泡到控制台
        event.preventDefault();
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setErrorInfo({
          hasError: true,
          errorType: 'network',
          errorMessage: '網絡連接問題',
          retryCount: 0
        });
      }
    };

    // 攔截 console.error 來捕獲 Firestore 錯誤
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const errorString = args.join(' ');
      
      if (errorString.includes('ERR_BLOCKED_BY_CLIENT') && 
          errorString.includes('firestore.googleapis.com')) {
        setErrorInfo({
          hasError: true,
          errorType: 'blocked_by_client',
          errorMessage: 'Firestore 服務被廣告攔截器阻止',
          retryCount: 0
        });
        return; // 不在控制台顯示這個錯誤
      }
      
      // 其他錯誤正常顯示
      originalConsoleError.apply(console, args);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalConsoleError;
    };
  }, []);

  const handleRetry = () => {
    setErrorInfo(prev => ({
      ...prev,
      hasError: false,
      errorType: null,
      errorMessage: '',
      retryCount: prev.retryCount + 1
    }));
    
    // 重新加載頁面
    window.location.reload();
  };

  const handleDismiss = () => {
    setErrorInfo(prev => ({
      ...prev,
      hasError: false
    }));
  };

  if (errorInfo.hasError && errorInfo.errorType === 'blocked_by_client') {
    return (
      <div>
        {children}
        
        {/* 錯誤提示覆蓋層 */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--ios-card)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--ios-border)'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px'
              }}>
                🚫
              </div>
              <h3 style={{
                color: 'var(--ios-text)',
                marginBottom: '8px',
                fontSize: '20px'
              }}>
                連接被攔截
              </h3>
              <p style={{
                color: 'var(--ios-text-secondary)',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                {errorInfo.errorMessage}
              </p>
            </div>

            <div style={{
              backgroundColor: 'var(--ios-background-secondary)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <h4 style={{
                color: 'var(--ios-text)',
                marginBottom: '12px',
                fontSize: '16px'
              }}>
                💡 解決方案：
              </h4>
              <ul style={{
                color: 'var(--ios-text-secondary)',
                fontSize: '14px',
                lineHeight: '1.6',
                paddingLeft: '20px',
                margin: 0
              }}>
                <li>暫時停用廣告攔截器（如 AdBlock、uBlock Origin）</li>
                <li>將本網站加入廣告攔截器的白名單</li>
                <li>嘗試使用無痕/隱私模式</li>
                <li>清除瀏覽器緩存和 Cookies</li>
                <li>嘗試使用其他瀏覽器</li>
              </ul>
            </div>

            {showTroubleshoot && (
              <div style={{
                backgroundColor: 'var(--ios-background)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                border: '1px solid var(--ios-border)'
              }}>
                <h4 style={{
                  color: 'var(--ios-text)',
                  marginBottom: '12px',
                  fontSize: '16px'
                }}>
                  🔧 詳細步驟：
                </h4>
                <div style={{
                  color: 'var(--ios-text-secondary)',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}>
                  <p><strong>Chrome/Edge:</strong></p>
                  <p>1. 點擊地址欄右側的擴充功能圖示</p>
                  <p>2. 找到廣告攔截器並點擊</p>
                  <p>3. 選擇「在此網站上停用」</p>
                  
                  <p style={{ marginTop: '12px' }}><strong>Firefox:</strong></p>
                  <p>1. 點擊地址欄左側的盾牌圖示</p>
                  <p>2. 關閉「增強型追蹤保護」</p>
                  
                  <p style={{ marginTop: '12px' }}><strong>Safari:</strong></p>
                  <p>1. 進入「偏好設定」&gt;「網站」</p>
                  <p>2. 在「內容攔截器」中停用相關擴充功能</p>
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              flexDirection: 'column'
            }}>
              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={handleRetry}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    backgroundColor: 'var(--ios-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  重試
                </button>
                <button
                  onClick={handleDismiss}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    backgroundColor: 'var(--ios-background-secondary)',
                    color: 'var(--ios-text)',
                    border: '1px solid var(--ios-border)',
                    borderRadius: '12px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  暫時忽略
                </button>
              </div>
              
              <button
                onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: 'var(--ios-text-secondary)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {showTroubleshoot ? '隱藏' : '顯示'}詳細步驟
              </button>
            </div>

            {errorInfo.retryCount > 2 && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 193, 7, 0.3)'
              }}>
                <p style={{
                  color: 'var(--ios-text-secondary)',
                  fontSize: '13px',
                  margin: 0,
                  textAlign: 'center'
                }}>
                  如果問題持續存在，請嘗試使用電腦版或聯繫技術支援
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default FirestoreErrorHandler; 