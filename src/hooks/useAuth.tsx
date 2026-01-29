import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useInactivityLogout } from './useInactivityLogout';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async () => {
    // Clear local state immediately
    setUser(null);
    setSession(null);
    
    // Clear custom session tracking
    localStorage.removeItem('solarizer_last_activity');
    localStorage.removeItem('solarizer_remember_me');
    
    // Sign out with global scope to invalidate on server too
    await supabase.auth.signOut({ scope: 'global' });
    
    // Force hard navigation to clear all state
    window.location.href = '/';
  }, []);

  // Use inactivity logout hook
  useInactivityLogout(user, signOut);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      // Store session preferences for inactivity tracking
      localStorage.setItem('solarizer_remember_me', rememberMe ? 'true' : 'false');
      localStorage.setItem('solarizer_last_activity', Date.now().toString());
    }
    
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
