import { useState, useEffect } from "react";
import { useAdminRole } from "@/hooks/useAdminRole";

const STORAGE_KEY = "solarizer_staging_mode";

export function useStagingMode() {
  const { isAdmin } = useAdminRole();
  const [isStagingMode, setIsStagingMode] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      const stored = localStorage.getItem(STORAGE_KEY);
      setIsStagingMode(stored === "true");
    } else {
      setIsStagingMode(false);
    }
  }, [isAdmin]);

  const toggleStagingMode = () => {
    if (!isAdmin) return;
    setIsStagingMode((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return {
    isStagingMode: isAdmin ? isStagingMode : false,
    toggleStagingMode,
  };
}
