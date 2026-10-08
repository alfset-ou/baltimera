"""Render the same exported CAD triangles for the WebGL fallback."""
from pathlib import Path
import json, numpy as np
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'dist/assets/panel-cad-v16.json').read_text())
yaw,pitch=-.55,.13
ry=np.array([[np.cos(yaw),0,np.sin(yaw)],[0,1,0],[-np.sin(yaw),0,np.cos(yaw)]])
rx=np.array([[1,0,0],[0,np.cos(pitch),-np.sin(pitch)],[0,np.sin(pitch),np.cos(pitch)]])
r=ry@rx
size=(1800,2400); img=Image.new('RGBA',size,(0,0,0,0)); draw=ImageDraw.Draw(img)
light=np.array([-.4,.7,1]);light/=np.linalg.norm(light)
polygons=[]
for part in data['parts']:
 p=np.array(part['positions']).reshape(-1,3)@r.T
 t=np.array(part['indices']).reshape(-1,3)
 for ids in t:
  tri=p[ids];normal=np.cross(tri[1]-tri[0],tri[2]-tri[0]);norm=np.linalg.norm(normal)
  if norm<1e-9:continue
  normal/=norm
  if normal[2]<=0:continue
  shade=.68+.32*max(0,np.dot(normal,light))
  base=np.array([181,137,85]) if part['material']=='wood' else np.array([67,71,76])
  color=tuple((base*shade).astype(int))+(255,)
  xy=[(900+x*.82/(1-z/6500),1200-y*.82/(1-z/6500)) for x,y,z in tri]
  polygons.append((tri[:,2].mean(),xy,color))
for _,poly,color in sorted(polygons,key=lambda x:x[0]):draw.polygon(poly,fill=color)
img.resize((900,1200),Image.Resampling.LANCZOS).save(root/'dist/assets/panel-cad-preview-v16.webp',lossless=True)
