import { useState, useEffect } from "react";
import { ChevronDown, AlertTriangle, AlertCircle, Info, FileCode, Lightbulb, Lock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FindingComments } from "@/components/FindingComments";
import { RemediationStatusToggle } from "@/components/RemediationStatusToggle";
import { FeatureLockedOverlay } from "@/components/FeatureLockedOverlay";

type Severity = "critical" | "high" | "medium" | "low" | "info";

interface Finding {
  id: string;
  title: string;
  severity: Severity;
  description: string;
  location?: {
    file: string | null;
    lines?: string;
  };
  code?: string;
  startLine?: number;
  remediation?: string;
  is_resolved?: boolean;
  resolved_at?: string | null;
  resolved_by?: string | null;
}

interface FindingItemProps {
  finding: Finding;
  isNew?: boolean;
  isHighlighted?: boolean;
  forceExpanded?: boolean;
  canViewRemediation?: boolean;
  canCommentOnFindings?: boolean;
  currentUserId?: string;
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

// Helper function to parse inline formatting (bold, italic, code)
// Bold labels (ending with :) render as block elements on new lines
const parseInlineFormatting = (text: string, keyPrefix: string): JSX.Element[] => {
  const result: JSX.Element[] = [];
  
  // Combined regex: **bold**, *italic*, `code`
  // Order matters: match ** before * to avoid conflicts
  const inlinePattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(inlinePattern);
  
  parts.forEach((part, index) => {
    if (!part) return;
    
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldContent = part.slice(2, -2);
      
      // Check if this is a label (ends with colon - like "Attack Vector:")
      const isLabel = boldContent.endsWith(':');
      
      if (isLabel) {
        // Render as block element on new line
        result.push(
          <strong 
            key={`${keyPrefix}-${index}`} 
            className="block mt-3 mb-1 font-semibold text-foreground"
          >
            {boldContent}
          </strong>
        );
      } else {
        // Regular inline bold
        result.push(
          <strong key={`${keyPrefix}-${index}`} className="font-semibold text-foreground">
            {boldContent}
          </strong>
        );
      }
    } else if (part.startsWith('`') && part.endsWith('`')) {
      // Inline code
      result.push(
        <code key={`${keyPrefix}-${index}`} className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono text-primary">
          {part.slice(1, -1)}
        </code>
      );
    } else if (part.startsWith('*') && part.endsWith('*')) {
      // Italic text
      result.push(
        <em key={`${keyPrefix}-${index}`} className="italic text-foreground/90">
          {part.slice(1, -1)}
        </em>
      );
    } else {
      // Regular text
      result.push(<span key={`${keyPrefix}-${index}`}>{part}</span>);
    }
  });
  
  return result;
};

// Helper function to render numbered lists with proper formatting
const renderNumberedList = (text: string, keyPrefix: string): { prefixText: string; list: JSX.Element; suffixText: string } | null => {
  const lines = text.split('\n');
  const listItems: { number: string; content: string }[] = [];
  const prefixLines: string[] = [];
  const suffixLines: string[] = [];
  let foundFirstItem = false;
  let listEnded = false;
  
  for (const line of lines) {
    const match = line.match(/^(\d+)\.\s+(.*)$/);
    if (match && !listEnded) {
      foundFirstItem = true;
      listItems.push({ number: match[1], content: match[2] });
    } else if (!foundFirstItem && line.trim()) {
      // Lines before the first numbered item
      prefixLines.push(line);
    } else if (foundFirstItem && !match) {
      // Lines after the list has started but aren't list items
      if (line.trim()) {
        listEnded = true;
        suffixLines.push(line);
      } else if (listEnded) {
        // Preserve empty lines in suffix for spacing
        suffixLines.push(line);
      }
    }
  }
  
  if (listItems.length === 0) return null;
  
  return {
    prefixText: prefixLines.join(' '),
    list: (
      <ol className="list-decimal list-outside ml-5 space-y-1.5 my-3">
        {listItems.map((item, idx) => (
          <li key={idx} className="text-sm text-foreground/90 pl-1">
            {parseInlineFormatting(item.content, `${keyPrefix}-li-${idx}`)}
          </li>
        ))}
      </ol>
    ),
    suffixText: suffixLines.join(' ').trim()
  };
};

// Helper function to render text with code formatting (both inline and block)
const renderWithCodeFormatting = (text: string, useHighlighting = false) => {
  // Normalize line endings and whitespace around code blocks
  const normalizedText = text
    .replace(/\r\n/g, '\n')  // Windows -> Unix line endings
    .replace(/```\s*(\w+)\s*\n/g, '```$1\n'); // Clean up language tag spacing
  
  // First, split by triple backtick code blocks - more permissive pattern
  const blockPattern = /```(\w+)?(?:\n|\s)?([\s\S]*?)```/g;
  const segments: (string | { type: 'codeblock'; language?: string; code: string })[] = [];
  
  let lastIndex = 0;
  let match;
  
  while ((match = blockPattern.exec(normalizedText)) !== null) {
    // Add text before the code block
    if (match.index > lastIndex) {
      segments.push(normalizedText.slice(lastIndex, match.index));
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
  if (lastIndex < normalizedText.length) {
    segments.push(normalizedText.slice(lastIndex));
  }

  // Second pass: detect unfenced code blocks (bare language tag on its own line followed by code)
  const knownLangs = ['solidity', 'sol', 'javascript', 'typescript', 'python', 'rust', 'go', 'java', 'cpp', 'c'];
  const langPattern = new RegExp(`(?:^|\\n)(${knownLangs.join('|')})\\n([\\s\\S]+?)(?=\\n\\n(?:[A-Z])|$)`, 'g');
  
  const processedSegments: typeof segments = [];
  for (const seg of segments) {
    if (typeof seg !== 'string') {
      processedSegments.push(seg);
      continue;
    }
    
    let segLastIndex = 0;
    let langMatch;
    langPattern.lastIndex = 0;
    let hasMatch = false;
    
    while ((langMatch = langPattern.exec(seg)) !== null) {
      hasMatch = true;
      const matchStart = langMatch.index + (langMatch[0].startsWith('\n') ? 1 : 0);
      if (matchStart > segLastIndex) {
        processedSegments.push(seg.slice(segLastIndex, matchStart));
      }
      processedSegments.push({
        type: 'codeblock' as const,
        language: langMatch[1],
        code: langMatch[2].trim(),
      });
      segLastIndex = langMatch.index + langMatch[0].length;
    }
    
    if (!hasMatch) {
      processedSegments.push(seg);
    } else if (segLastIndex < seg.length) {
      processedSegments.push(seg.slice(segLastIndex));
    }
  }
  
  return processedSegments.map((segment, segmentIndex) => {
    if (typeof segment === 'object' && segment.type === 'codeblock') {
      // Render code block with syntax highlighting for Solidity
      const isSolidity = segment.language === 'solidity' || segment.language === 'sol';
      return (
        <div key={segmentIndex} className="my-3 bg-background rounded-md border border-border p-3 text-sm overflow-x-auto max-w-full" style={{ fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace" }}>
          {segment.language && (
            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
              {segment.language}
            </div>
          )}
          <div className="min-w-max">
            {isSolidity || useHighlighting 
              ? highlightSolidityCode(segment.code, 1) 
              : <pre className="whitespace-pre overflow-x-auto text-foreground/90">{segment.code}</pre>
            }
          </div>
        </div>
      );
    }
    
    // For regular text segments, check for numbered lists first
    const textSegment = segment as string;
    
      // Check if this segment contains a numbered list (multiple lines starting with numbers)
      const listMatch = textSegment.match(/(?:^|\n)(\d+)\.\s+/gm);
      if (listMatch && listMatch.length >= 2) {
        const listResult = renderNumberedList(textSegment, `segment-${segmentIndex}`);
        if (listResult) {
          return (
            <span key={segmentIndex}>
              {listResult.prefixText && (
                <p className="mb-2">
                  {parseInlineFormatting(listResult.prefixText, `segment-${segmentIndex}-prefix`)}
                </p>
              )}
              {listResult.list}
              {listResult.suffixText && (
                <p className="mt-2">
                  {parseInlineFormatting(listResult.suffixText, `segment-${segmentIndex}-suffix`)}
                </p>
              )}
            </span>
          );
        }
      }
    
    // Handle inline formatting (bold, italic, code) for non-list text
    return (
      <span key={segmentIndex}>
        {parseInlineFormatting(textSegment, `segment-${segmentIndex}`)}
      </span>
    );
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
  canCommentOnFindings = false,
  currentUserId,
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
          <div className="hidden sm:flex items-center gap-3 shrink-0 min-w-[80px]">
            {finding.location?.lines && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                <span className="font-mono">L{finding.location.lines}</span>
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
              <FileCode className="w-3 h-3 shrink-0" />
              <span className="font-mono text-[11px] whitespace-nowrap">L{finding.location.lines}</span>
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
            <div className="text-sm text-foreground/90 leading-relaxed text-justify">
              {renderWithCodeFormatting(finding.description)}
            </div>
          </div>

          {/* File */}
          {finding.location?.file && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                File
              </h4>
              <div className="flex items-center gap-2 text-sm">
                <FileCode className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-primary truncate max-w-[200px] sm:max-w-[400px]" title={finding.location.file}>
                  {finding.location.file}
                </span>
              </div>
            </div>
          )}

          {/* Lines */}
          {finding.location?.lines && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Lines
              </h4>
              <span className="font-mono text-sm text-muted-foreground">
                {finding.location.lines}
              </span>
            </div>
          )}

        {/* Affected Code */}
        {finding.code && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Affected Code
            </h4>
            <div className="bg-background rounded-md border border-border p-3 text-sm overflow-x-auto max-w-full" style={{ fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace" }}>
              <div className="min-w-max">
                {highlightSolidityCode(finding.code, finding.startLine)}
              </div>
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
                  <div className="text-sm text-foreground/90 leading-relaxed text-justify">
                    {renderWithCodeFormatting(finding.remediation)}
                  </div>
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

          {/* Remediation Status Toggle - Business only */}
          {canCommentOnFindings ? (
            <RemediationStatusToggle
              findingId={finding.id}
              isResolved={finding.is_resolved ?? false}
              resolvedAt={finding.resolved_at}
              resolvedBy={finding.resolved_by}
            />
          ) : (
            <div className="relative">
              <div className="opacity-50 pointer-events-none">
                <div className="flex items-center justify-between py-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Remediation Status
                  </h4>
                  <Button variant="outline" size="sm" disabled className="gap-2">
                    Mark as Resolved
                  </Button>
                </div>
              </div>
              <FeatureLockedOverlay
                featureName="Track Remediation Progress"
                requiredPlan="business"
                description="Mark findings as resolved and track your remediation progress."
                variant="inline"
                onUpgrade={onUpgradeClick}
              />
            </div>
          )}

          {/* Comments Section - Business only */}
          {canCommentOnFindings ? (
            <FindingComments 
              findingId={finding.id} 
              currentUserId={currentUserId}
            />
          ) : (
            <div className="relative">
              <div className="opacity-50 pointer-events-none">
                <div className="flex items-center gap-2 py-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Comments
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground">Team collaboration on findings.</p>
              </div>
              <FeatureLockedOverlay
                featureName="Comment on Findings"
                requiredPlan="business"
                description="Collaborate with your team by adding comments to findings."
                variant="inline"
                onUpgrade={onUpgradeClick}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FindingItem;
