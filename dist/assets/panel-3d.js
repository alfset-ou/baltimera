import * as THREE from './three.module.js';

const root = document.querySelector('#panel-model');
const canvas = root.querySelector('canvas');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch {
  root.classList.add('model-unavailable');
}
if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
  camera.position.set(0, .12, 7.5);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb5a38e, 1.8));
  const key = new THREE.DirectionalLight(0xffedda, 2.8);
  key.position.set(4, 5, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 2);
  rim.position.set(-4, 2, -3);
  scene.add(rim);
  const panel = new THREE.Group();
  scene.add(panel);
  // Tessellated directly from the client's STEP B-rep, in millimetres.
  // No proxy boxes, invented fasteners, rails or backing plate.
  const response = await fetch(new URL('./panel-cad-v16.json', import.meta.url));
  if (!response.ok) throw new Error('CAD geometry unavailable');
  const cad = await response.json();
  const scale = 3.6 / cad.boundsMm.length;
  const steel = new THREE.MeshStandardMaterial({color: 0x101215, roughness: .96, metalness: .12});
  const wood = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: .9});
  const finishOptions = {natural: {amount: 0, tint: 1}, black: {amount: 1, tint: .055}, grey: {amount: 1, tint: .7}};
  let finishTarget = finishOptions[root.dataset.finish] || finishOptions.natural;
  const finishUniforms = {finishAmount: {value: finishTarget.amount}, finishTint: {value: finishTarget.tint}};
  wood.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, finishUniforms);
    shader.fragmentShader = 'uniform float finishAmount; uniform float finishTint;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      float timberLuma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(timberLuma * finishTint), finishAmount);`);
  };
  wood.customProgramCacheKey = () => 'structured-timber-v19';
  // Use the client's actual structured timber photograph as the surface map.
  const texture = await new THREE.TextureLoader().loadAsync(new URL('./panel-wood-v19.webp', import.meta.url).href);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  wood.map = texture;
  wood.bumpMap = texture;
  wood.bumpScale = .0008;
  // Fine, low relief for the matte steel finish; does not change CAD geometry.
  const grain = document.createElement('canvas'); grain.width = 128; grain.height = 128;
  const ctx = grain.getContext('2d');
  let seed = 9005;
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const value = 110 + (seed % 36);
    ctx.fillStyle = `rgb(${value},${value},${value})`; ctx.fillRect(x, y, 1, 1);
  }
  const steelTexture = new THREE.CanvasTexture(grain);
  steelTexture.wrapS = steelTexture.wrapT = THREE.RepeatWrapping;
  steelTexture.repeat.set(12, 60);
  steel.bumpMap = steelTexture; steel.bumpScale = .00025;
  let partIndex = 0;
  for (const part of cad.parts) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(part.positions.map(value => value * scale));
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(part.indices);
    geometry.computeVertexNormals();
    {
      const uv = [];
      const xs = part.positions.filter((_, i) => i % 3 === 0);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      for (let i = 0; i < part.positions.length; i += 3) {
        const across = (part.positions[i] - minX) / (maxX - minX);
        const crops = [[.035,.205],[.33,.56],[.755,.97]];
        const [u0,u1] = part.material === 'wood' ? crops[partIndex % 3] : [0,1];
        uv.push(u0 + across * (u1-u0), part.positions[i + 1] / cad.boundsMm.length + .5);
      }
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    }
    const mesh = new THREE.Mesh(geometry, part.material === 'wood' ? wood : steel);
    mesh.name = part.name;
    panel.add(mesh);
    partIndex++;
  }
  const radius = Math.hypot(cad.boundsMm.width, cad.boundsMm.length, cad.boundsMm.depth) * scale / 2;
  function fitCamera(aspect) {
    const halfAngle = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * Math.min(aspect, 1));
    camera.position.set(0, 0, radius / Math.sin(halfAngle) * 1.06);
    camera.lookAt(0, 0, 0);
  }

  let yaw = -.43, pitch = .12;
  let targetYaw = yaw, targetPitch = pitch;
  let automatic = false;
  let visible = false, dragging = false;
  let zoom = 1, targetZoom = 1;
  const pointers = new Map();
  let gesture = null;
  const clampZoom = value => THREE.MathUtils.clamp(value, 1, 4);
  function applyView() {
    camera.zoom = zoom;
    camera.position.x = 0; camera.position.y = 0;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  function gestureState() {
    const [a, b] = [...pointers.values()];
    if (!a || !b) return null;
    return {distance: Math.max(1, Math.hypot(b.x-a.x, b.y-a.y)), x: (a.x+b.x)/2, y: (a.y+b.y)/2};
  }
  let previousX = 0, previousY = 0, previousTime = 0, frame = 0;
  function requestRender() {
    if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render);
  }
  function render(time) {
    frame = 0;
    const delta = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
    previousTime = time;
    if (automatic && !dragging) targetYaw += delta * .16;
    const smoothing = reducedMotion.matches ? 1 : .16;
    yaw += (targetYaw - yaw) * smoothing;
    pitch += (targetPitch - pitch) * smoothing;
    zoom += (targetZoom - zoom) * smoothing;
    finishUniforms.finishAmount.value += (finishTarget.amount - finishUniforms.finishAmount.value) * smoothing;
    finishUniforms.finishTint.value += (finishTarget.tint - finishUniforms.finishTint.value) * smoothing;
    applyView();
    panel.rotation.set(pitch, yaw, 0, 'YXZ');
    renderer.render(scene, camera);
    if (automatic || Math.abs(targetYaw - yaw) + Math.abs(targetPitch - pitch) + Math.abs(targetZoom - zoom) + Math.abs(finishTarget.amount - finishUniforms.finishAmount.value) + Math.abs(finishTarget.tint - finishUniforms.finishTint.value) > .0001) requestRender();
  }
  new ResizeObserver(() => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    fitCamera(camera.aspect);
    camera.updateProjectionMatrix();
    requestRender();
  }).observe(canvas);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    previousTime = 0;
    if (visible) requestRender();
    else if (frame) { cancelAnimationFrame(frame); frame = 0; }
  }, {threshold: .05}).observe(canvas);
  document.addEventListener('visibilitychange', () => {previousTime = 0; requestRender();});
  canvas.addEventListener('wheel', event => {
    if (!root.classList.contains('model-active')) return;
    event.preventDefault();
    automatic = false;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1);
    targetZoom = clampZoom(targetZoom * Math.exp(-THREE.MathUtils.clamp(delta, -240, 240) * .002));
    requestRender();
  }, {passive: false});
  canvas.addEventListener('pointerdown', event => {
    if (!root.classList.contains('model-active')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
    dragging = true; automatic = false;
    previousX = event.clientX; previousY = event.clientY;
    gesture = gestureState();
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('is-dragging');
  });
  canvas.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
    if (pointers.size >= 2) {
      const next = gestureState();
      if (gesture) {
        targetZoom = clampZoom(targetZoom * next.distance / gesture.distance);
      }
      gesture = next;
    } else {
      targetYaw += (event.clientX - previousX) * .012;
      targetPitch += (event.clientY - previousY) * .009;
    }
    previousX = event.clientX; previousY = event.clientY;
    requestRender();
  });
  function release(event) {
    pointers.delete(event.pointerId);
    gesture = gestureState();
    const remaining = pointers.values().next().value;
    if (remaining) {previousX = remaining.x; previousY = remaining.y;}
    dragging = pointers.size > 0;
    if (!dragging) canvas.classList.remove('is-dragging');
  }
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('lostpointercapture', release);
  canvas.addEventListener('keydown', event => {
    if (!root.classList.contains('model-active')) return;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', '+', '=', '-', '_'].includes(event.key)) return;
    event.preventDefault(); automatic = false; 
    if (event.key === 'ArrowLeft') targetYaw -= .2;
    if (event.key === 'ArrowRight') targetYaw += .2;
    if (event.key === 'ArrowUp') targetPitch -= .2;
    if (event.key === 'ArrowDown') targetPitch += .2;
    if (event.key === '+' || event.key === '=') targetZoom = clampZoom(targetZoom * 1.2);
    if (event.key === '-' || event.key === '_') targetZoom = clampZoom(targetZoom / 1.2);
    if (event.key === 'Home') {targetYaw = -.43; targetPitch = .12; targetZoom = 1;}
    requestRender();
  });
  root.addEventListener('model:finish', () => {finishTarget = finishOptions[root.dataset.finish] || finishOptions.natural; requestRender();});
  root.addEventListener('model:activate', () => {automatic = !reducedMotion.matches; previousTime = 0; requestRender();});
  finishTarget = finishOptions[root.dataset.finish] || finishOptions.natural;
  finishUniforms.finishAmount.value = finishTarget.amount;
  finishUniforms.finishTint.value = finishTarget.tint;
  root.classList.add('model-ready');
  reducedMotion.addEventListener('change', () => {if (reducedMotion.matches) automatic = false;  requestRender();});
  
}
