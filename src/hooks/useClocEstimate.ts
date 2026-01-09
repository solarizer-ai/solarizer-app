import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FileInput {
  name: string;
  content: string;
}

export interface LanguageStats {
  files: number;
  blank: number;
  comment: number;
  code: number;
}

export interface ClocResult {
  totalNloc: number;
  languages: {
    [key: string]: LanguageStats;
  };
}

export function useClocEstimate() {
  return useMutation({
    mutationFn: async (files: FileInput[]): Promise<ClocResult> => {
      const response = await supabase.functions.invoke('cloc-estimate', {
        body: { files },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to estimate CLOC');
      }

      return response.data as ClocResult;
    },
  });
}
