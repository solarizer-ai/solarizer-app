

# Add Launch Pricing Banner to Pricing Page

## Design Concept

A slim, full-width banner placed between the hero subtitle and the billing note. It uses a subtle warm gradient border (orange → amber) with a near-transparent dark fill, a small flame/sparkle accent, and tight typography — feels premium and urgent without being aggressive or salesy.

**Visual treatment:**
- Rounded pill shape, centered, max-width ~600px
- 1px border using a linear gradient (orange-500 → amber-400 → orange-500)
- Inner background: `bg-primary/[0.04]` (barely-there warm tint)
- Small `Zap` icon in orange as a subtle accent
- Copy: "Launch pricing — lock in these rates before they go up."
- A secondary muted line: "Limited period only"

## Changes

**`src/pages/Pricing.tsx`** — Insert a new banner element between the hero `</section>` (line 363) and the billing note `<p>` (line 366).

```tsx
{/* ── Launch banner ── */}
<div
  className="flex items-center justify-center gap-2 mx-auto max-w-xl mb-6 px-5 py-2.5 rounded-full border border-primary/20 bg-primary/[0.04] animate-in fade-in slide-in-from-bottom-4 duration-600"
  style={{ animationDelay: "200ms" }}
>
  <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
  <p className="text-sm font-medium">
    Launch pricing
    <span className="text-muted-foreground/50 font-normal">
      {" "}— lock in these rates before they go up.
    </span>
  </p>
</div>
```

Single insertion, no other files affected. Uses the existing `Zap` icon already imported on line 5.

