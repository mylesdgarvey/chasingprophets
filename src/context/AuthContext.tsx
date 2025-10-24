import React, { createContext, useContext, useState, useEffect } from 'react';
import * as AmazonCognitoIdentity from 'amazon-cognito-identity-js';

interface User {
  username: string;
  role: 'user' | 'admin';
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  signIn: (username: string, password: string, newPassword?: string) => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || ''
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Set up interval to check auth status
    const interval = setInterval(checkAuth, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  async function checkAuth() {
    try {
      const cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      // Guard: ensure getSession exists on the returned object
      if (typeof cognitoUser.getSession !== 'function') {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const session = await new Promise<AmazonCognitoIdentity.CognitoUserSession>((resolve, reject) => {
        try {
          cognitoUser.getSession((err: Error | null, session: AmazonCognitoIdentity.CognitoUserSession) => {
            if (err) return reject(err);
            resolve(session);
          });
        } catch (e) {
          reject(e);
        }
      });

      if (!session || !session.isValid || !session.isValid()) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      // Attempt to read attributes but don't fail auth if they can't be read
      let email = '';
      try {
        if (typeof cognitoUser.getUserAttributes === 'function') {
          const userAttributes = await new Promise<AmazonCognitoIdentity.CognitoUserAttribute[]>((resolve, reject) => {
            cognitoUser.getUserAttributes((err: Error | undefined | null, result: AmazonCognitoIdentity.CognitoUserAttribute[] | undefined | null) => {
              if (err) return reject(err);
              resolve(result || []);
            });
          });
          email = userAttributes.find((attr) => attr.getName() === 'email')?.getValue() || '';
        }
      } catch (err) {
        console.warn('Failed to read user attributes, proceeding with username only', err);
        email = '';
      }

      const role = email === 'admin@chasingprophets.local' ? 'admin' : 'user';

      setUser({
        username: typeof cognitoUser.getUsername === 'function' ? cognitoUser.getUsername() : '',
        email,
        role
      });
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    }
  }

  const signIn = async (username: string, password: string, newPassword?: string) => {
    const authDetails = new AmazonCognitoIdentity.AuthenticationDetails({
      Username: username,
      Password: password,
      ValidationData: {
        EMAIL: username
      }
    });

    const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
      Username: username,
      Pool: userPool
    });

    try {
      await new Promise((resolve, reject) => {
        cognitoUser.authenticateUser(authDetails, {
          onSuccess: (session) => {
            console.log('Authentication successful:', session);
            resolve(session);
          },
          onFailure: (err) => {
            console.error('Authentication failed:', err);
            reject(err);
          },
          newPasswordRequired: (userAttributes, _requiredAttributes) => {
            if (newPassword) {
              delete userAttributes.email_verified;
              delete userAttributes.email;
              cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
                onSuccess: resolve,
                onFailure: reject
              });
            } else {
              reject({ code: 'NewPasswordRequired', message: 'You need to change your password' });
            }
          }
        });
      });

      await checkAuth();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signOut = () => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}