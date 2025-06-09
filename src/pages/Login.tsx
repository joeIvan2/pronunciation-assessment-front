import React, { useState } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';

const Login: React.FC = () => {
  const { user, signInWithGoogle, signOutUser } = useFirebaseAuth();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('登入失敗:', error);
      setError(`登入失敗: ${error.message || '請重試或檢查網路連接'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ padding: '2rem' }}>
      {user ? (
        <div>
          <p>歡迎, {user.displayName}</p>
          <button onClick={signOutUser}>登出</button>
        </div>
      ) : (
        <div>
          <button 
            onClick={handleLogin}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? '登入中...' : '使用 Google 登入'}
          </button>
          {error && (
            <div style={{ 
              color: 'red', 
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#ffebee',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Login;
