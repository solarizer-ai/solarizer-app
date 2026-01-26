

## Summary of Changes

Three updates are needed:
1. **Footer scroll-to-top**: All footer links should scroll to the top of the page when clicked
2. **Home page text updates**: Remove "AI" from comparison table text and rename a feature title


---

## 1. Footer Links Scroll to Top

### Files to Modify
- `src/components/Footer.tsx`
- `src/components/MinimalFooter.tsx`

### Changes

**Footer.tsx:**
Create a custom `ScrollLink` component that wraps the `Link` with an `onClick` handler:

```tsx
const ScrollLink = ({ to, children, className }) => {
  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <Link to={to} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
};
```

Replace all `<Link>` components with `<ScrollLink>` - Logo, Product links, Intelligence links, Legal links.

**MinimalFooter.tsx:**
Add `onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}` to Privacy and Terms links.

---

## 2. Home Page Text Updates

### File to Modify
- `src/pages/Home.tsx`

### Changes

| Location | Current Text | New Text |
|----------|-------------|----------|
| Line 20 (`features`) | "AI-Generated Remediation" | "AI-Powered Remediation" |
| Line 64 (`comparisonData`) | "Multi-Stage AI Scanning" | "Multi-Stage Scanning" |
| Line 69 (`comparisonData`) | "Semantic AI Analysis" | "Semantic Analysis" |

---

## 3. Pricing Page - USD Only (Remove Currency Selector)

### File to Modify
- `src/pages/Pricing.tsx`

### Changes

1. **Remove currency imports and state** (lines 19-20, 111, 119-130):
   - Remove: `currencies, Currency, defaultCurrency, convertPrice, formatPrice, getCurrencyByCode` imports
   - Remove: `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` imports
   - Remove: `selectedCurrency` state
   - Remove: `useEffect` for loading saved currency
   - Remove: `handleCurrencyChange` function

2. **Remove Currency Selector UI** (lines 302-320):
   - Delete the entire currency selector `<div>` block
   - Delete the disclaimer text about INR processing

3. **Update price display** - Change from:
   ```tsx
   {formatPrice(convertPrice(displayPrice || 0, selectedCurrency), selectedCurrency)}
   ```
   To:
   ```tsx
   ${displayPrice?.toLocaleString()}
   ```

4. **Update power-up section** - Display prices in USD format directly.



## Summary of Files to Modify

| File | Action |
|------|--------|
| `src/components/Footer.tsx` | Add scroll-to-top on link click |
| `src/components/MinimalFooter.tsx` | Add scroll-to-top on link click |
| `src/pages/Home.tsx` | Update 3 text strings |
| `src/pages/Pricing.tsx` | Remove currency selector, display USD prices |
| `supabase/functions/cashfree-create-order/index.ts` | Send USD to Cashfree (pending confirmation) |
| `supabase/functions/cashfree-create-subscription/index.ts` | Use USD amounts (pending confirmation) |
| `supabase/functions/cashfree-upgrade-subscription/index.ts` | Use USD amounts (pending confirmation) |

