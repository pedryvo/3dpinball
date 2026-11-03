# Pinball Physics & Collision Engine Specification (`PB_COL.C`, `PB_SPLIN.C`, `PB_FRAME.C`)

Derived from static analysis of `PINBALL.EXE` (`sha256: 4e675a78ba3a...`) via REA MCP.

## 1. Original Source Modules Identified via Assertions

Assertion strings in the `DATA` segment (`0x461f5c`–`0x4646f5`, `ev_f026cc1af44e5009f57a057d21ee83f239460d3de2ef5b49926648014485a8cc`) identify seven core C modules:
- `..\SOURCE\PB_INIT.C`: Global subsystem initialization and resource loading.
- `..\SOURCE\PB_3INIT.C`: Table state machine initialization (Colony, Command Post, Mine).
- `..\SOURCE\PB_BIN.C`: Binary deserialization of `.TBL` and `.TBM` chunks (`MAP:`, `APP:`, `DAT:`).
- `..\SOURCE\PB_COL.C`: Ball-to-wall, ball-to-bumper, and ball-to-flipper collision detection and impulse resolution.
- `..\SOURCE\PB_SPLIN.C`: Ramp spline trajectories and 2.5D Z-layer transitions (`GFXZBuffer`).
- `..\SOURCE\PB_FRAME.C`: Per-frame fixed-timestep physics integration and animation tick.
- `..\SOURCE\PB_INTER.C`: Table rules, target banks, multiball locks, and scoring callouts.

## 2. Coordinate Space & Z-Layers

- **Playfield Viewport**: `640×480` total screen; active playfield area occupies `x ∈ [0, 492]`, `y ∈ [0, 480]`, while the right-hand sidebar (`x ∈ [492, 640]`) displays the status HUD, ball launch gauge, and score readouts.
- **Z-Layers**:
  - `z = 0`: Main table surface (flippers, slingshots, bumpers, drop targets, sinkholes).
  - `z = 1`: Elevated habitrail / overhead ramps (`PB_SPLIN.C`), using `OUTPOSTZ.BMP` / `CPZ.BMP` / `MINEZ.BMP` for depth occlusion.
