import { useMutation } from "@tanstack/react-query";
import { invokeWithRefresh } from "@/lib/sessionRefresh";

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
      const { data, error } = await invokeWithRefresh<ClocResult>('cloc-estimate', {
        body: { files },
      });

      if (error) {
        throw error;
      }

      return data as ClocResult;
    },
  });
}
