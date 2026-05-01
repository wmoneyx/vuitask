import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeFetch } from './lib/utils';
import { supabase } from './lib/supabase';

export interface UserProfile {
  user_uuid: string;
  user_email: string;
  user_name: string;
  avatar_url: string;
  vui_coin_balance: number;
  coin_task_balance: number;
  today_balance: number;
  monthly_balance: number;
  is_admin: boolean;
  is_banned: boolean;
  today_turns: number;
}

interface UserContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = async () => {
    const uuid = localStorage.getItem('userUUID');
    if (!uuid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const data = await safeFetch('/api/user/sync-profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ uuid })
      });

      if (data && data.profile) {
        setProfile(data.profile);
      } else if (data && data.error) {
        setError(data.error);
        console.error("Sync Profile Error:", data.error);
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ');
      console.error("Refresh Profile Failed:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshProfile();
    
    // Listen for Supabase auth changes for faster sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);
      if (session?.user) {
        localStorage.setItem('userUUID', session.user.id);
        refreshProfile();
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('userUUID');
        setProfile(null);
      }
    });

    // Listen for balance updates from other components
    const handleUpdate = () => refreshProfile();
    window.addEventListener('balanceUpdated', handleUpdate);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('balanceUpdated', handleUpdate);
    };
  }, []);

  return (
    <UserContext.Provider value={{ profile, loading, error, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
