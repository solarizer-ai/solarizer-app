

# Update Pricing Page Trial CTA Social Links

## Change

**`src/pages/Pricing.tsx`** (lines 389-407)

Replace the text links ("Request on Telegram", "Request on X") with icon-only links using inline SVGs (same icons as Footer.tsx), and update URLs to:
- Telegram: `https://t.me/solarizer_ai`
- X: `https://x.com/solarizer_io`

Remove the `|` separator span. Use a simple `flex gap-4` with icon buttons styled similarly to the footer icons but using `text-primary` color.

