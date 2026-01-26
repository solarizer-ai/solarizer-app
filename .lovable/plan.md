# Plan Complete ✓

Annual billing has been removed from the application. Only monthly billing is now available.

## Changes Made

- **Frontend**: Removed billing toggle, annual pricing from Pricing page
- **Hooks**: Updated type definitions to only allow `"monthly"`
- **UpgradeConfirmationModal**: Removed `billingPeriod` prop
- **Docs**: Removed Annual Discount FAQ
- **nlocCalculator**: Simplified credits config (no annual)
- **Settings**: Simplified price display to always show `/month`
- **Edge Functions**: Removed annual pricing and plan IDs from all Cashfree functions
