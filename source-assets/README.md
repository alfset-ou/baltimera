# Panel CAD source

`panel.stp` is the uploaded “Panel STP.stp” (Rhino 8 / STEP B-rep).
`panel-specification.png` is the uploaded product sheet.

The viewer is generated directly from seven valid CAD solids: six timber
lamellas and one continuous profiled aluminium base. No solids are redesigned.
OpenCascade tessellation: 0.025 mm linear and 0.08 rad angular deflection.
Coordinates are recentered and transformed (X, Z, -Y), then uniformly scaled
for presentation. Source SHA-256, bounds and per-part volumes are in the JSON.

The STEP envelope measures 450.997862 × 2404.823086 × 33.8 mm. The sheet
specifies nominal 451 mm total width, 415 mm cover width, 2400 mm length,
33 mm nominal depth and 40 × 18 mm timber sections. The sloped timber end
extends the model's envelope beyond the nominal 2400 mm extrusion length.
The website uses nominal product dimensions from the supplied sheet.

Timber grain and powder-coated aluminium colors are presentation materials,
not certified colors from the STEP file. They do not alter the geometry.

To regenerate with CadQuery installed:

    python scripts/convert-panel.py
    python scripts/render-panel-preview.py
    python generate.py

The fallback preview is rendered from the exact same triangulated model.

October 7 product update: the client specifies galvanized ArcelorMittal steel
with Granite® Ultramat, 35 µm, RAL 9005, and northern thermally modified pine.
The base is now classified as steel; the STEP geometry remains unchanged.
The natural texture comes from the client's supplied structured timber photograph.
Black and grey timber finishes are visual approximations; final grey is pending.
