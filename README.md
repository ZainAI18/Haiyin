# Docking Atlas AI

A bilingual visual encyclopedia for studying a ship docking survey. Explore the exterior of a schematic ship, search the bilingual term catalog, and step through three docking methods. No account, database configuration, or exam is needed.

## Run locally

Use Node.js 22 or later and npm. The lockfile pins the installed dependencies.

```sh
npm ci
npm test
npm run check:assets
npm run build
npm start
```

Open http://localhost:3000. Use `npm run dev` for development. The build script selects Next.js's Webpack builder for compatibility with the Windows runtime used to verify this project.

- `/atlas`: rotate and zoom a closed hull. Pick a mesh or use Rudder, Propeller, and Anchor to focus. Lookup joins English, simplified Chinese and aliases. Try `/atlas?term=propeller-root-crack` for a defect overlay.
- `/vessels/hai-yin-i`: drawing-based **partial** MT Hai Yin I reconstruction, a metre-scale rudder envelope, the searchable register of all 160 PDFs, revision decisions and geometry gaps. See [the reconstruction record](docs/HAI-YIN-I-RECONSTRUCTION.md). This model uses actual metre units independently of the schematic atlas scale below; the full ship and engine room are not complete.
- `/term/[slug]`: the bilingual term, Chinese explanation, PDF provenance and the best available view or scene.
- `/scenes/dry-dock`, `/scenes/floating-dock`, `/scenes/synchrolift`: learn how the three systems support and expose the ship. Each has four manually selectable stages and optional playback.
- `/guide`: browse by inspection area or find a reading-only term without starting the 3D viewer.

## Catalog and provenance

`data/terms.json` contains the bilingual catalog. Related spellings and shortened expressions are aliases. The kind, source edition/page, Chinese explanation, confidence and mapping are validated at build and load time. See [the source audit](docs/source-audit.md) for page coverage and terminology decisions. Historical values carry a separate flag and a visible 1996 warning. The figures and instructions in the PDFs are source material; they are not operational instructions for this app or for a live docking operation.

## 3D models

The repository runs with a clearly labeled, unscaled schematic, since no licensed production ship asset was supplied. The hull closes at the bow, stern and deck. Named schematic parts are deliberately simplified. Related-area focus does not claim to show the internal shape of absent parts. Defect marks are examples.

To install a legally licensed textured ship, use a self-contained binary glTF 2.0 file such as `public/models/vessel-v1.glb`. Export with **Y up**, **+X forward** and the origin close to midships; normalize the exterior to roughly 17 scene units long. Use unique readable node names (mesh or mesh-bearing group):

```text
hull bow stern rudder rudder-stock propeller propeller-boss shaft
anchor sea-chest bilge-keel anodes deck
```

Keep groups independently selectable, for example by placing the propeller boss under the propeller. The IDs above are required. The additional IDs in `lib/domain.ts`, such as `stem` and `forecastle`, are optional. Selecting an optional part that the GLB lacks opens the labeled schematic for that part. Configure `data/ship-model.json`:

```json
{
  "production": {
    "url": "/models/vessel-v1.glb",
    "title": "Ship model credit title",
    "author": "Asset author",
    "source": "https://example.com/asset-provenance",
    "license": "Exact license name and attribution terms"
  }
}
```

Record the actual permission/license alongside the file. Run `npm run check:assets` and inspect each focus path in the browser. Include base-color textures, use meshes and textures within the delivery budget, and avoid decoder-dependent assets unless you add and test the appropriate decoder. Update the revision in the URL when replacing the asset.

The browser shows a compact schematic first. It loads the optional named GLB only for a mounted ship viewer, validates its parts and textures, then swaps it in. A failed or aborted load never blocks the schematic; geometry, materials, textures and owned image bitmaps are released when the asset leaves. Scene routes use their own compact illustrative geometry. Canvas code is lazy loaded; the guide has no Canvas. On-demand frames resume only during interaction or movement. DPR is capped (1.25 on small/touch devices, 1.6 otherwise), shadows are disabled, and reduced-motion preference shortens transitions. Select 2D any time; unsupported WebGL or context loss falls back to the same labeled profile diagram.

## Optional Supabase

JSON is the default and has no external runtime dependency. To enable the optional read-only catalog repository:

1. Apply `supabase/migrations/0001_catalog.sql`.
2. Generate the seed SQL with `node scripts/export-supabase-seed.mjs` and run it as a database administrator. The migration grants application roles read-only access.
3. Set `DOCKING_CATALOG_BACKEND=supabase`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY` on the server using `.env.example`. Build again so the term pages can be generated from the configured data. Keep the database and local catalog aligned if both environments are in use.

The server adapter reads in stable pages and validates the same schema as local JSON. The rest of the app uses the same catalog interface. No service-role key is used.
