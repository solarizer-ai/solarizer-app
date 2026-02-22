

# Premium 3D Solarizer Logo — Bold, Thick, and Shiny

## Problem
The logo currently renders on a visible square box and looks flat. It needs to feel bold, thick, shiny, and premium — not a thin rotating card.

## Changes (single file: `src/components/Logo3D.tsx`)

### 1. Use a thicker extruded box instead of a flat plane
- Keep `boxGeometry` but change args from `[2.4, 2.4, 0.15]` to `[2.5, 2.5, 0.35]` — increasing depth from 0.15 to 0.35 for a bold, chunky feel
- The thicker depth gives the logo a strong 3D presence as it rotates

### 2. Make transparent parts invisible
- Set `alphaTest={0.5}` on the material so transparent PNG regions are cut away — only the S logo and its immediate background show
- Keep `transparent={true}`

### 3. Boost premium shiny feel
- Increase `emissiveIntensity` from `0.15` to `0.5` for a stronger orange glow
- Decrease `roughness` from `0.4` to `0.15` for a highly reflective, glossy surface
- Increase `metalness` from `0.3` to `0.7` for a bold metallic sheen
- These values together create a polished metal look

### 4. Enhance lighting for shine and depth
- Increase main orange `pointLight` intensity from `1` to `1.8`
- Increase secondary white `pointLight` intensity from `0.4` to `0.8`
- Add a third rim light from behind: `position={[0, 0, -3]}`, `intensity={0.6}`, `color="#F97316"` — creates an orange edge glow as it spins
- Increase `ambientLight` intensity from `0.6` to `0.8` to brighten the overall scene

### 5. No other files modified

## Summary of Material Values

| Property          | Before | After |
|-------------------|--------|-------|
| Box depth         | 0.15   | 0.35  |
| emissiveIntensity | 0.15   | 0.5   |
| roughness         | 0.4    | 0.15  |
| metalness         | 0.3    | 0.7   |
| alphaTest         | none   | 0.5   |
| Main light        | 1.0    | 1.8   |
| Fill light        | 0.4    | 0.8   |
| Ambient light     | 0.6    | 0.8   |
| Rim light         | none   | 0.6   |

