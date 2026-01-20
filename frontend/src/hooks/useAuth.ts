/**
 * Authentication Hook
 * 
 * Manages Google OAuth authentication state.
 * Stores user info in localStorage for persistence.
 */

import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

export interface User {
  name: string;
  email: string;
  picture: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
      }
    }
    setLoading(false);
  }, []);

  // Google login
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Fetch user info from Google
        const response = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo`,
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch user info');
        }

        const userData = await response.json();
        const userInfo: User = {
          name: userData.name,
          email: userData.email,
          picture: userData.picture,
        };

        setUser(userInfo);
        localStorage.setItem('user', JSON.stringify(userInfo));
      } catch (error) {
        console.error('Login error:', error);
        alert('Failed to login. Please try again.');
      }
    },
    onError: () => {
      alert('Login failed. Please try again.');
    },
  });

  // Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };
}
