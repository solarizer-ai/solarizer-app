/**
 * Frontend language configuration.
 * Minimal config — just what the UI needs for file filtering, display, and highlighting.
 */

export interface FrontendLanguageConfig {
  id: string;
  displayName: string;
  /** File extensions considered "scope" files for this language */
  extensions: string[];
  /** Icon/emoji for display */
  icon: string;
  /** Code block language for markdown fences */
  codeBlockLang: string;
  /** Report ID prefix (e.g. SOL-, RST-) */
  reportPrefix: string;
  /** Noun for "contract" / "program" in UI text */
  moduleNoun: string;
  moduleNounPlural: string;
}

export const LANGUAGE_CONFIGS: Record<string, FrontendLanguageConfig> = {
  solidity: {
    id: 'solidity',
    displayName: 'Solidity',
    extensions: ['.sol'],
    icon: '⟠',
    codeBlockLang: 'solidity',
    reportPrefix: 'SOL',
    moduleNoun: 'contract',
    moduleNounPlural: 'contracts',
  },
  'rust-solana': {
    id: 'rust-solana',
    displayName: 'Rust (Solana)',
    extensions: ['.rs'],
    icon: '🦀',
    codeBlockLang: 'rust',
    reportPrefix: 'RST',
    moduleNoun: 'program',
    moduleNounPlural: 'programs',
  },
};

/** Universal context file extensions (allowed regardless of language) */
export const CONTEXT_EXTENSIONS = ['.json', '.md', '.txt', '.js', '.ts', '.yaml', '.yml', '.toml'];

/** Get all allowed extensions for a language (scope + context) */
export function getAllowedExtensions(languageId: string): string[] {
  const lang = LANGUAGE_CONFIGS[languageId];
  if (!lang) return CONTEXT_EXTENSIONS;
  return [...lang.extensions, ...CONTEXT_EXTENSIONS];
}

/** Check if a file is a scope file for the given language */
export function isScopeFile(filename: string, languageId: string): boolean {
  const lang = LANGUAGE_CONFIGS[languageId];
  if (!lang) return false;
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return lang.extensions.includes(ext);
}

export function getLanguageConfig(languageId: string): FrontendLanguageConfig {
  return LANGUAGE_CONFIGS[languageId] || LANGUAGE_CONFIGS.solidity;
}

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_CONFIGS);
