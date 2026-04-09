'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  photoURL?: string;
  role: string;
}

interface AuthContextType {
  user: any | null; // Keep for compatibility
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (username?: string, password?: string) => Promise<{ error: any } | void>;
  signUp: () => Promise<{ error: any }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage on mount
    try {
      const savedUser = localStorage.getItem('family_session');
      if (savedUser) {
        setUserProfile(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Failed to load session', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = async (username?: string, password?: string) => {
    if (!username) {
      window.location.href = '/login';
      return;
    }

    // Manual user mapping (Simple for children/family)
    const USERS: Record<string, { name: string, role: string, pass: string }> = {
      'dad': { name: 'Bố', role: 'admin', pass: '1111' },
      'mom': { name: 'Mẹ', role: 'admin', pass: '2222' },
      'kid': { name: 'Bé', role: 'member', pass: '3333' }
    };

    const userKey = username.toLowerCase();
    const userInfo = USERS[userKey];

    if (userInfo && password !== userInfo.pass) {
      return { error: 'Mật khẩu không đúng' };
    }

    const displayName = userInfo ? userInfo.name : username;
    const role = userInfo ? userInfo.role : 'admin';

    // Simple mock login
    const profile: UserProfile = {
      uid: `user-${userKey}`,
      username: username,
      displayName: displayName,
      role: role,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    };

    // Set cookie for server-side auth recognition (works on Vercel)
    document.cookie = `family_session=${profile.uid}; path=/; max-age=86400; SameSite=Lax`;
    
    localStorage.setItem('family_session', JSON.stringify(profile));
    setUserProfile(profile);
    return { error: null };
  };

  const signUp = async () => {
    return { error: 'Tính năng này không còn cần thiết.' };
  };

  const logout = async () => {
    document.cookie = 'family_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    localStorage.removeItem('family_session');
    setUserProfile(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user: userProfile, userProfile, loading, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
