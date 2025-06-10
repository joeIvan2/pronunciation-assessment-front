import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // 更新 state 使得下一次渲染能夠顯示降級後的 UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary 捕捉到錯誤:', error, errorInfo);
    
    // 如果是 Firestore 錯誤，記錄但不阻止應用運行
    if (error.message.includes('FIRESTORE') || error.message.includes('Unexpected state')) {
      console.warn('Firestore 內部錯誤，但應用程式可以繼續運行');
      // 重置錯誤狀態，讓應用繼續運行
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
      }, 1000);
      return;
    }
    
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      // 如果是 Firestore 錯誤，顯示簡單提示但不阻止使用
      if (this.state.error?.message.includes('FIRESTORE') || this.state.error?.message.includes('Unexpected state')) {
        return (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid rgba(255, 0, 0, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            maxWidth: '300px',
            zIndex: 9999,
            fontSize: '14px',
            color: '#d32f2f'
          }}>
            ⚠️ 雲端同步遇到問題，但應用程式仍可正常使用
          </div>
        );
      }

      // 其他嚴重錯誤的完整錯誤頁面
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          background: '#f5f5f5',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h1 style={{ color: '#d32f2f', marginBottom: '20px' }}>出現錯誤</h1>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ color: '#333', marginBottom: '15px' }}>錯誤詳情:</h2>
            <pre style={{
              background: '#f8f8f8',
              padding: '15px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              border: '1px solid #ddd'
            }}>
              {this.state.error?.message}
            </pre>
            
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                重新載入頁面
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                style={{
                  padding: '10px 20px',
                  background: '#fff',
                  color: '#1976d2',
                  border: '1px solid #1976d2',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                嘗試繼續
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 