

# Fix Billing Modal Buttons - Simple & Clean

## Problem
The buttons are not visible because the current layout structure is too complex with:
- `p-0` on DialogContent removing all padding
- ScrollArea with calculated max-height
- Footer with `pt-0` getting clipped

## Solution
Simplify the modal structure using a standard, reliable pattern that works on both mobile and desktop.

## Changes

### File: `src/components/BillingInfoModal.tsx`

**Simplify to a standard dialog pattern:**

1. **Remove `p-0` from DialogContent** - use default padding
2. **Remove complex ScrollArea wrapper** - let the dialog handle overflow naturally  
3. **Use `DialogFooter` component** for buttons - standard pattern that always works
4. **Add `overflow-y-auto` directly on the form** with a reasonable max-height

**New structure:**
```tsx
<DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
  <DialogHeader>
    {/* Title and description */}
  </DialogHeader>
  
  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
    {/* All form fields */}
  </form>
  
  <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
    <Button variant="outline" onClick={() => onOpenChange(false)}>
      Cancel
    </Button>
    <Button type="button" onClick={handleSubmit(onSubmit)}>
      Confirm & Pay
    </Button>
  </DialogFooter>
</DialogContent>
```

**Key changes:**
- Use `DialogFooter` from the UI library (proper semantic footer)
- Remove `ScrollArea` complexity - use native `overflow-y-auto`
- Standard responsive classes: `sm:max-w-lg` for desktop width
- Mobile: Full width with proper padding
- Desktop: Max 512px width, centered

This is the simplest, most reliable approach that matches how other modals in the project work.

