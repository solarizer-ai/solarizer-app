import { useState, useEffect } from "react";
import { ChevronDown, AlertTriangle, AlertCircle, Info, FileCode, Lightbulb, Lock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Severity = "critical" | "high" | "medium" | "low" | "info";

interface Finding {
  id: string;
  title: string;
  severity: Severity;
  description: string;
  location?: {
    file: string;
    lines?: string;
  };
  code?: string;
  startLine?: number;
  remediation?: string;
  is_resolved?: boolean;
}

interface FindingItemProps {
  finding: Finding;
  isNew?: boolean;
  isHighlighted?: boolean;
  forceExpanded?: boolean;
  canViewRemediation?: boolean;
  onUpgradeClick?: () => void;
  onRefReady?: (el: HTMLDivElement | null) => void;
}

const severityConfig: Record<Severity, { icon: typeof AlertTriangle; label: string; className: string }> = {
  critical: {
    icon: AlertTriangle,
    label: "Critical",
    className: "text-critical bg-critical/10 border-critical/20",
  },
  high: {
    icon: AlertTriangle,
    label: "High",
    className: "text-destructive bg-destructive/10 border-destructive/20",
  },
  medium: {
    icon: AlertCircle,
    label: "Medium",
    className: "text-warning bg-warning/10 border-warning/20",
  },
  low: {
    icon: Info,
    label: "Low",
    className: "text-primary bg-primary/10 border-primary/20",
  },
  info: {
    icon: Info,
    label: "Info",
    className: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  },
};

// Helper function to render text with code formatting (both inline and block)
const renderWithCodeFormatting = (text: string, useHighlighting = false) => {
  // First, split by triple backtick code blocks
  const blockPattern = /```(\w+)?\n?([\s\S]*?)```/g;
  const segments: (string | { type: 'codeblock'; language?: string; code: string })[] = [];
  
  let lastIndex = 0;
  let match;
  
  while ((match = blockPattern.exec(text)) !== null) {
    // Add text before the code block
    if (match.index > lastIndex) {
      segments.push(text.slice(lastIndex, match.index));
    }
    // Add the code block
    segments.push({
      type: 'codeblock',
      language: match[1],
      code: match[2].trim(),
    });
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after last code block
  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex));
  }
  
  return segments.map((segment, segmentIndex) => {
    if (typeof segment === 'object' && segment.type === 'codeblock') {
      // Render code block with syntax highlighting for Solidity
      const isSolidity = segment.language === 'solidity' || segment.language === 'sol';
      return (
        <div key={segmentIndex} className="my-3 bg-background rounded-md border border-border p-3 font-mono text-sm overflow-x-auto">
          {segment.language && (
            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
              {segment.language}
            </div>
          )}
          <div>
            {isSolidity || useHighlighting 
              ? highlightSolidityCode(segment.code, 1) 
              : <pre className="whitespace-pre-wrap text-foreground/90">{segment.code}</pre>
            }
          </div>
        </div>
      );
    }
    
    // For regular text segments, handle inline backticks
    const textSegment = segment as string;
    const parts = textSegment.split(/(`[^`]+`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={`${segmentIndex}-${index}`} className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono text-primary">
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={`${segmentIndex}-${index}`}>{part}</span>;
    });
  });
};

// Solidity syntax highlighting
const solidityKeywords = new Set([
  'function', 'contract', 'pragma', 'solidity', 'public', 'private',
  'external', 'internal', 'view', 'pure', 'payable', 'returns', 'return',
  'if', 'else', 'for', 'while', 'require', 'assert', 'revert', 'modifier',
  'event', 'emit', 'mapping', 'struct', 'enum', 'import', 'using', 'library',
  'interface', 'constructor', 'memory', 'storage', 'calldata', 'virtual',
  'override', 'constant', 'immutable', 'new', 'delete', 'true', 'false',
  'this', 'super', 'is', 'abstract', 'indexed', 'anonymous', 'unchecked'
]);

const solidityTypes = new Set([
  'uint', 'uint256', 'uint128', 'uint64', 'uint32', 'uint16', 'uint8',
  'int', 'int256', 'int128', 'int64', 'int32', 'int16', 'int8',
  'address', 'bool', 'string', 'bytes', 'bytes32', 'bytes4', 'bytes20'
]);

const highlightSolidityCode = (code: string | undefined, startLine: number = 1) => {
  if (!code) return null;
  const lines = code.split('\n');
  
  // Calculate the width needed for line numbers based on the largest line number
  const maxLineNumber = startLine + lines.length - 1;
  const lineNumberWidth = Math.max(3, String(maxLineNumber).length);
  
  return lines.map((line, lineIndex) => {
    const lineNumber = startLine + lineIndex;
    const tokens: JSX.Element[] = [];
    let remaining = line;
    let tokenIndex = 0;
    
    while (remaining.length > 0) {
      // Check for single-line comment
      const commentMatch = remaining.match(/^(\/\/.*)/);
      if (commentMatch) {
        tokens.push(
          <span key={`${lineIndex}-${tokenIndex++}`} className="text-muted-foreground italic">
            {commentMatch[1]}
          </span>
        );
        remaining = remaining.slice(commentMatch[1].length);
        continue;
      }
      
      // Check for string
      const stringMatch = remaining.match(/^("[^"]*"|'[^']*')/);
      if (stringMatch) {
        tokens.push(
          <span key={`${lineIndex}-${tokenIndex++}`} className="text-green-400">
            {stringMatch[1]}
          </span>
        );
        remaining = remaining.slice(stringMatch[1].length);
        continue;
      }
      
      // Check for number (hex or decimal)
      const numberMatch = remaining.match(/^(0x[0-9a-fA-F]+|\d+)/);
      if (numberMatch) {
        tokens.push(
          <span key={`${lineIndex}-${tokenIndex++}`} className="text-orange-400">
            {numberMatch[1]}
          </span>
        );
        remaining = remaining.slice(numberMatch[1].length);
        continue;
      }
      
      // Check for word (keyword, type, or identifier)
      const wordMatch = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (wordMatch) {
        const word = wordMatch[1];
        let className = "text-foreground/90";
        
        if (solidityKeywords.has(word)) {
          className = "text-purple-400";
        } else if (solidityTypes.has(word) || word.startsWith('uint') || word.startsWith('int') || word.startsWith('bytes')) {
          className = "text-blue-400";
        }
        
        tokens.push(
          <span key={`${lineIndex}-${tokenIndex++}`} className={className}>
            {word}
          </span>
        );
        remaining = remaining.slice(word.length);
        continue;
      }
      
      // Default: take one character
      tokens.push(
        <span key={`${lineIndex}-${tokenIndex++}`} className="text-foreground/90">
          {remaining[0]}
        </span>
      );
      remaining = remaining.slice(1);
    }
    
    return (
      <div key={lineIndex} className="flex leading-relaxed">
        <span 
          className="pr-3 text-right text-muted-foreground/50 select-none shrink-0 border-r border-border/50 mr-3"
          style={{ width: `${lineNumberWidth + 1}ch` }}
        >
          {lineNumber}
        </span>
        <span className="flex-1">
          {tokens.length > 0 ? tokens : '\u00A0'}
        </span>
      </div>
    );
  });
};

const FindingItem = ({ 
  finding, 
  isNew = false, 
  isHighlighted = false,
  forceExpanded = false,
  canViewRemediation = true,
  onUpgradeClick,
  onRefReady 
}: FindingItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = severityConfig[finding.severity];
  const Icon = config.icon;

  // Auto-expand when forceExpanded changes to true
  useEffect(() => {
    if (forceExpanded) {
      setIsExpanded(true);
    }
  }, [forceExpanded]);

  return (
    <div 
      ref={onRefReady}
      className={cn(
        "border border-border rounded-lg overflow-hidden bg-card/50 transition-all duration-300",
        isNew && "animate-fade-in ring-2 ring-primary/30",
        isHighlighted && "ring-2 ring-warning animate-highlight-pulse"
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 hover:bg-muted/30 transition-colors text-left"
      >
        {/* Mobile: Stacked layout, Desktop: Inline layout */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          {/* Top row on mobile: Badge + Chevron */}
          <div className="flex items-center justify-between sm:contents">
            <div className={cn(
              "flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium border shrink-0 min-w-[85px] justify-center",
              config.className
            )}>
              <Icon className="w-3.5 h-3.5" />
              {config.label}
            </div>
            
            {/* Chevron - visible on mobile in top row */}
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200 sm:hidden",
              isExpanded && "rotate-180"
            )} />
          </div>
          
          {/* Title - full width on mobile, can wrap to 2 lines */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground line-clamp-2 sm:truncate">
              {renderWithCodeFormatting(finding.title)}
            </p>
          </div>

          {/* Location + Chevron (desktop only) */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {finding.location?.lines && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileCode className="w-3.5 h-3.5" />
                <span className="font-mono">{finding.location.lines}</span>
              </div>
            )}
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-180"
            )} />
          </div>
          
          {/* Location on mobile - smaller, below title */}
          {finding.location?.lines && (
            <div className="flex sm:hidden items-center gap-1.5 text-xs text-muted-foreground">
              <FileCode className="w-3 h-3" />
              <span className="font-mono text-[11px]">{finding.location.lines}</span>
            </div>
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border p-4 space-y-4 bg-muted/20">
          {/* Description */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Description
            </h4>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {renderWithCodeFormatting(finding.description)}
            </p>
          </div>

          {/* Location */}
          {finding.location && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Location
              </h4>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono text-primary">{finding.location.file}</span>
                {finding.location.lines && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">Lines {finding.location.lines}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Affected Code */}
          {finding.code && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Affected Code
              </h4>
              <div className="bg-background rounded-md border border-border p-3 font-mono text-sm overflow-x-auto">
                {highlightSolidityCode(finding.code, finding.startLine)}
              </div>
            </div>
          )}

          {/* Remediation - Locked for Starter users */}
          {finding.remediation && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                {canViewRemediation ? (
                  <Lightbulb className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                Remediation Guide
              </h4>
              {canViewRemediation ? (
                <div className="bg-success/5 border border-success/20 rounded-md p-4">
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {renderWithCodeFormatting(finding.remediation)}
                  </p>
                </div>
              ) : (
                <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      <p className="text-sm text-foreground/90">
                        Upgrade to Pro to view AI-powered fix recommendations
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpgradeClick?.();
                      }}
                      className="shrink-0"
                    >
                      <Zap className="w-3.5 h-3.5 mr-1.5" />
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FindingItem;
