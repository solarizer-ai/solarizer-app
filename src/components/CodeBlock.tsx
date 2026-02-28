import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  startLine?: number;
  useHighlighting?: boolean;
  highlightFn?: (code: string, startLine: number) => React.ReactNode;
}

// Auto-format: normalize indentation, re-indent by brace nesting, clean up blank lines
const autoFormatCode = (code: string): string => {
  const lines = code.split('\n');

  // 1. Strip common leading whitespace
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);
  const minIndent = nonEmptyLines.length > 0
    ? Math.min(...nonEmptyLines.map(l => l.match(/^\s*/)?.[0].length ?? 0))
    : 0;
  const stripped = lines.map(l => l.slice(minIndent).trimEnd());

  // 2. Re-indent based on brace nesting
  let depth = 0;
  const indented = stripped.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';

    // Decrease depth for closing braces/parens
    if (trimmed.startsWith('}') || trimmed.startsWith(')')) {
      depth = Math.max(0, depth - 1);
    }

    const formatted = '    '.repeat(depth) + trimmed;

    // Increase depth for opening braces/parens at end of line
    if (trimmed.endsWith('{') || trimmed.endsWith('(')) {
      depth++;
    }

    return formatted;
  });

  // 3. Collapse 3+ consecutive blank lines into 1
  const result: string[] = [];
  let blankCount = 0;
  for (const line of indented) {
    if (line === '') {
      blankCount++;
      if (blankCount <= 1) result.push(line);
    } else {
      blankCount = 0;
      result.push(line);
    }
  }

  return result.join('\n');
};

const CodeBlock = ({ code, language, startLine = 1, useHighlighting = false, highlightFn }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const formattedCode = autoFormatCode(code);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="my-3 bg-background rounded-md border border-border overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-2.5 py-1 bg-muted/50 border-b border-border">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span className="text-green-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code content */}
      <div className="p-2.5 text-[13px] overflow-x-auto max-w-full" style={{ fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace" }}>
        <div className="min-w-max">
          {highlightFn
            ? highlightFn(formattedCode, startLine)
            : <pre className="whitespace-pre overflow-x-auto text-foreground/90">{formattedCode}</pre>
          }
        </div>
      </div>
    </div>
  );
};

export default CodeBlock;
