# Hai Yin I reconstruction verification

Historical first-checkpoint record (rudder-only stage). For the current whole-vessel assembly and two independent vessel pages, see [current status](HAI-YIN-I-WHOLE-SHIP-STATUS.md).

Verified locally on 2026-11-18 against the production build. This is a partial reconstruction, not a completed ship.

- `npm run build`: passed, including TypeScript and 343 generated pages. The new route is `/vessels/hai-yin-i`.
- `npm test`: 11 tests passed. New checks cover all 160 PDF records / 782 pages, 157 unique hashes, rejection of the five Not Approved submissions, eight cargo compartments totalling 807.0 m³, and actual GLB geometry bounds.
- Chrome: all 160 source records can be loaded, searched and filtered. Rejected filter returns five files; exact duplicate filter returns three. Cybermarine duplicate relationship is searchable.
- The GLB downloads and renders. It is not fetched before the user opens 3D. Orbit changes the rendered view; reset restores the camera without a second model fetch. Switching to 2D removes the canvas.
- Static 3D submits no additional draw calls after settling. Canvas uses `frameloop="demand"`, capped DPR, no shadows and one small GLB.
- A 390 px mobile viewport has no document overflow. Unsupported WebGL and a missing GLB both show the source-derived 2D profile.
- Visual inspection confirmed the rudder envelope and dimension/source labels. Model size is approximately 1.400 × 2.080 × 0.251962 m. Source polyline precision is not a fabrication tolerance.

Browser verification found and corrected an actual reset defect: unmounting a renderer triggered its own context-loss handler. Reset now moves the existing camera, while the context-loss listener has an effect cleanup. A missing favicon was also corrected.

This verification checks the implemented viewer and source data contracts. It does not certify the drawing interpretation, validate every candidate revision, or establish full vessel geometry. Hull, equipment, piping and detailed assemblies remain unfinished; their status is shown on the page and in the reconstruction record.
