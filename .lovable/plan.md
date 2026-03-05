

# Auto Scroll-to-Top on Route Changes

## Problem
When navigating between pages, the scroll position persists from the previous page, causing poor UX.

## Solution
Add a `ScrollToTop` component inside `BrowserRouter` in `App.tsx` that listens to `location.pathname` changes and calls `window.scrollTo(0, 0)`.

### Changes

**New component: `src/components/ScrollToTop.tsx`**
```tsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export default ScrollToTop;
```

**`src/App.tsx`**
- Import `ScrollToTop`
- Place `<ScrollToTop />` as the first child inside `<BrowserRouter>`

This covers all route changes globally — Home, Pricing, Docs, Dashboard, etc.

