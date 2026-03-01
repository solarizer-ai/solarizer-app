import type React from "react";

export const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="px-1.5 py-0.5 rounded bg-foreground/[0.04] border border-border/10 text-xs font-mono">
    {children}
  </code>
);

export const DocTable = ({
  headers,
  rows,
  className = "",
}: {
  headers: string[];
  rows: React.ReactNode[][];
  className?: string;
}) => (
  <div className={`overflow-x-auto ${className}`}>
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-border/10">
          {headers.map((h) => (
            <th
              key={h}
              className="py-2 px-3 text-left font-medium text-muted-foreground"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-border/10 last:border-0">
            {row.map((cell, j) => (
              <td key={j} className="py-2 px-3">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const Yes = () => (
  <span className="text-green-500 font-medium">&#10003;</span>
);

export const No = () => (
  <span className="text-muted-foreground">&mdash;</span>
);
