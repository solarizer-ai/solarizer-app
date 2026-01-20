import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const STANDARD_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 hours
const REMEMBER_ME_TIMEOUT_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export const useInactivityLogout = (user: { id: string } | null, signOut: () => Promise<void>) => {
  const updateLastActivity = useCallback(() => {
    if (user) {
      localStorage.setItem('solarizer_last_activity', Date.now().toString());
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Initialize last activity on mount if not set
    if (!localStorage.getItem('solarizer_last_activity')) {
      localStorage.setItem('solarizer_last_activity', Date.now().toString());
    }

    // Check if session is expired based on inactivity
    const checkExpiration = () => {
      const lastActivity = parseInt(localStorage.getItem('solarizer_last_activity') || '0');
      const rememberMe = localStorage.getItem('solarizer_remember_me') === 'true';
      const timeout = rememberMe ? REMEMBER_ME_TIMEOUT_MS : STANDARD_TIMEOUT_MS;

      if (Date.now() - lastActivity > timeout) {
        // Clear storage and sign out
        localStorage.removeItem('solarizer_last_activity');
        localStorage.removeItem('solarizer_remember_me');
        signOut();
      }
    };

    // Check on mount
    checkExpiration();

    // Set up activity listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, updateLastActivity));

    // Periodic check every minute
    const interval = setInterval(checkExpiration, 60 * 1000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, updateLastActivity));
      clearInterval(interval);
    };
  }, [user, signOut, updateLastActivity]);
};
