

# Interactive 3D Solarizer Logo — Two-Column CTA Layout

## Overview
Place the actual Solarizer logo as a 3D object beside the "Secure your contracts from your terminal" CTA section. Instead of a generic "S" letter, the logo PNG will be used as a texture on a 3D plane, giving it depth, glow, and rotation.

## Visual Layout

```text
Desktop (md+):
+-------------------+----------------------------+
|                   |  Secure your contracts     |
|  [3D Solarizer    |  from your terminal        |
|   Logo spinning   |                            |
|   with glow]      |  subtitle text...          |
|                   |  $ npm install -g solarizer|
|                   |  View documentation ->     |
+-------------------+----------------------------+

Mobile:
+----------------------------+
|     [3D Solarizer Logo]    |
+----------------------------+
|  Secure your contracts     |
|  from your terminal        |
|  subtitle text...          |
|  $ npm install -g ...      |
|  View documentation ->     |
+----------------------------+
```

## Technical Details

### Dependencies to Install
- `@react-three/fiber@^8.18.0`
- `@react-three/drei@^9.122.0`
- `three@^0.160.0`

### New File: `src/components/Logo3D.tsx`
- Uses `useTexture` from drei to load `solarizer-logo.png` as a texture
- Renders the logo on a rounded 3D plane (or box with slight depth) to give it a 3D card-like appearance
- Orange emissive glow around the edges using a subtle point light
- Slow auto-rotation on Y-axis via `useFrame`
- Subtle floating animation (sine-wave Y oscillation)
- Ambient light + orange-tinted point light for branded depth
- Accepts `className` prop for external sizing
- No orbit controls — purely automatic animation

### Modified File: `src/pages/Home.tsx`
- Lazy-import `Logo3D` with `React.lazy` + `Suspense`
- Restructure CTA section (Section 4) into a two-column grid:
  - Container: `grid grid-cols-1 md:grid-cols-2 gap-8 items-center`
  - Left column (desktop) / Top (mobile): `Logo3D` in a `w-48 h-48 md:w-56 md:h-56 mx-auto` container
  - Right column (desktop) / Bottom (mobile): existing heading, subtitle, install box, docs link
  - Text alignment: `text-center md:text-left`
- Increase section `max-w` from `max-w-2xl` to `max-w-4xl`

### Why Texture Instead of Text3D
The Solarizer logo is a custom graphic (PNG), not a standard letter. Using it as a texture on a 3D surface preserves the actual brand identity while still achieving the interactive 3D spinning effect with depth and glow.

