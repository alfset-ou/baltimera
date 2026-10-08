"""Convert the supplied STEP solids without rebuilding or simplifying their shape.
Requires CadQuery/OpenCascade. Units remain millimetres in the exported data.
"""
from pathlib import Path
import hashlib, json
import cadquery as cq
root = Path(__file__).resolve().parents[1]
source = root / 'source-assets/panel.stp'
shape = cq.importers.importStep(str(source)).val()
b = shape.BoundingBox()
center = [(b.xmin+b.xmax)/2,(b.ymin+b.ymax)/2,(b.zmin+b.zmax)/2]
parts = []
for i, solid in enumerate(shape.Solids()):
    assert solid.isValid(), f'Invalid source solid {i}'
    vertices, triangles = solid.tessellate(.025, .08)
    # Right-handed transform: STEP X -> viewer X, STEP Z -> viewer Y,
    # STEP -Y -> viewer Z. The wood faces then point toward the camera.
    positions = [round(c,6) for v in vertices for c in
                 (v.x-center[0],v.z-center[2],-(v.y-center[1]))]
    parts.append(dict(name=f'part-{i+1}',material='wood' if i<6 else 'steel',
                      positions=positions,indices=[j for t in triangles for j in t],
                      sourceVolumeMm3=solid.Volume()))
data = dict(source='Panel STP.stp',sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),
            units='mm',linearDeflectionMm=.025,angularDeflectionRad=.08,
            boundsMm=dict(width=b.xlen,length=b.zlen,depth=b.ylen),parts=parts)
(root/'dist/assets/panel-cad-v16.json').write_text(json.dumps(data,separators=(',',':')))
print(data['boundsMm'], 'solids',len(parts),'triangles',sum(len(p['indices'])//3 for p in parts))
