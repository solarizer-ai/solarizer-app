import type { SandpackTheme } from "@codesandbox/sandpack-react";

export const solarizerDarkTheme: SandpackTheme = {
  colors: {
    surface1: "#0a0a0a", // --background
    surface2: "#0f0f0f", // --card
    surface3: "#1a1a1a", // --muted
    clickable: "#8c8c8c", // --muted-foreground
    base: "#fafafa", // --foreground
    disabled: "#666666", // --text-tertiary
    hover: "#242424", // --border
    accent: "#f97316", // --primary (solar orange)
    error: "#ef4444", // --destructive
    errorSurface: "rgba(239, 68, 68, 0.1)",
  },
  syntax: {
    plain: "#fafafa",
    comment: { color: "#6b7280", fontStyle: "italic" },
    keyword: "#f97316", // solar orange for keywords
    tag: "#22c55e", // green
    punctuation: "#8c8c8c",
    definition: "#60a5fa", // blue
    property: "#a78bfa", // purple
    static: "#f59e0b", // amber
    string: "#22c55e", // green
  },
  font: {
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
    size: "13px",
    lineHeight: "22px",
  },
};

export const solarizerLightTheme: SandpackTheme = {
  colors: {
    surface1: "#ffffff", // --background
    surface2: "#fafafa", // --card
    surface3: "#f5f5f5", // --muted
    clickable: "#737373", // --muted-foreground
    base: "#0d0d0d", // --foreground
    disabled: "#a3a3a3", // --text-tertiary
    hover: "#e5e5e5", // --border
    accent: "#ea580c", // --primary (solar orange)
    error: "#ef4444", // --destructive
    errorSurface: "rgba(239, 68, 68, 0.1)",
  },
  syntax: {
    plain: "#0d0d0d",
    comment: { color: "#9ca3af", fontStyle: "italic" },
    keyword: "#ea580c", // solar orange
    tag: "#16a34a", // green
    punctuation: "#737373",
    definition: "#2563eb", // blue
    property: "#7c3aed", // purple
    static: "#d97706", // amber
    string: "#16a34a", // green
  },
  font: {
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
    size: "13px",
    lineHeight: "22px",
  },
};
