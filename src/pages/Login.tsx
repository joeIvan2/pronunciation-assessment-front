import React from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';

const Login: React.FC = () => {
  const { user, signInWithGoogle, signOutUser } = useFirebaseAuth();

  return (
    <div className="login-page" style={{ padding: '2rem' }}>
      {user ? (
        <div>
          <p>Welcome, {user.displayName}</p>
          <button onClick={signOutUser}>Sign Out</button>
        </div>
      ) : (
        <button onClick={signInWithGoogle}>Login with Google</button>
      )}
    </div>
  );
};

export default Login;
