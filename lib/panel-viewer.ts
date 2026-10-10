import * as THREE from 'three';

// Direct port of the designer's panel-3d.js. The geometry is the client's
// tessellated STEP B-rep loaded from /public/data; nothing is re-modelled.

export type ViewerFinish = 'natural' | 'black' | 'grey';

export type PanelViewer = {
  setFinish(finish: ViewerFinish): void;
  /** Starts the idle rotation and enables dragging / zooming. */
  activate(): void;
  dispose(): void;
};

type CadPart = {
  name: string;
  material: string;
  positions: number[];
  indices: number[];
};

type CadFile = {
  boundsMm: { width: number; length: number; depth: number };
  parts: CadPart[];
};

const CAD_URL = '/data/panel-cad-v16.json';
const TIMBER_URL = '/images/panel-wood-v19.webp';

const FINISH_OPTIONS: Record<ViewerFinish, { amount: number; tint: number }> = {
  natural: { amount: 0, tint: 1 },
  black: { amount: 1, tint: 0.055 },
  grey: { amount: 1, tint: 0.7 },
};

const clampZoom = (value: number) => THREE.MathUtils.clamp(value, 1, 4);

export async function createPanelViewer(
  canvas: HTMLCanvasElement,
  options: { finish: ViewerFinish },
): Promise<PanelViewer> {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.12, 7.5);
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
  const response = await fetch(CAD_URL);
  if (!response.ok) throw new Error('CAD geometry unavailable');
  const cad = (await response.json()) as CadFile;

  const scale = 3.6 / cad.boundsMm.length;
  const steel = new THREE.MeshStandardMaterial({ color: 0x101215, roughness: 0.96, metalness: 0.12 });
  const wood = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });

  let finishTarget = FINISH_OPTIONS[options.finish] ?? FINISH_OPTIONS.natural;
  const finishUniforms = {
    finishAmount: { value: finishTarget.amount },
    finishTint: { value: finishTarget.tint },
  };

  wood.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, finishUniforms);
    shader.fragmentShader = 'uniform float finishAmount; uniform float finishTint;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
      float timberLuma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(timberLuma * finishTint), finishAmount);`,
    );
  };
  wood.customProgramCacheKey = () => 'structured-timber-v19';

  // The client's actual structured timber photograph is the surface map.
  const texture = await new THREE.TextureLoader().loadAsync(TIMBER_URL);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  wood.map = texture;
  wood.bumpMap = texture;
  wood.bumpScale = 0.0008;

  // Fine, low relief for the matte steel finish; does not change CAD geometry.
  const grain = document.createElement('canvas');
  grain.width = 128;
  grain.height = 128;
  const ctx = grain.getContext('2d');
  let seed = 9005;
  if (ctx) {
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const value = 110 + (seed % 36);
        ctx.fillStyle = `rgb(${value},${value},${value})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  const steelTexture = new THREE.CanvasTexture(grain);
  steelTexture.wrapS = steelTexture.wrapT = THREE.RepeatWrapping;
  steelTexture.repeat.set(12, 60);
  steel.bumpMap = steelTexture;
  steel.bumpScale = 0.00025;

  const geometries: THREE.BufferGeometry[] = [];
  let partIndex = 0;
  for (const part of cad.parts) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(part.positions.map((value) => value * scale));
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(part.indices);
    geometry.computeVertexNormals();
    const uv: number[] = [];
    const xs = part.positions.filter((_, i) => i % 3 === 0);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const crops: [number, number][] = [
      [0.035, 0.205],
      [0.33, 0.56],
      [0.755, 0.97],
    ];
    for (let i = 0; i < part.positions.length; i += 3) {
      const across = (part.positions[i] - minX) / (maxX - minX);
      const [u0, u1] = part.material === 'wood' ? crops[partIndex % 3] : [0, 1];
      uv.push(u0 + across * (u1 - u0), part.positions[i + 1] / cad.boundsMm.length + 0.5);
    }
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const mesh = new THREE.Mesh(geometry, part.material === 'wood' ? wood : steel);
    mesh.name = part.name;
    panel.add(mesh);
    geometries.push(geometry);
    partIndex++;
  }

  const radius =
    (Math.hypot(cad.boundsMm.width, cad.boundsMm.length, cad.boundsMm.depth) * scale) / 2;

  function fitCamera(aspect: number): void {
    const halfAngle = Math.atan(
      Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * Math.min(aspect, 1),
    );
    camera.position.set(0, 0, (radius / Math.sin(halfAngle)) * 1.06);
    camera.lookAt(0, 0, 0);
  }

  let yaw = -0.43;
  let pitch = 0.12;
  let targetYaw = yaw;
  let targetPitch = pitch;
  let automatic = false;
  let active = false;
  let visible = false;
  let dragging = false;
  let zoom = 1;
  let targetZoom = 1;
  const pointers = new Map<number, { x: number; y: number }>();
  let gesture: { distance: number; x: number; y: number } | null = null;

  function applyView(): void {
    camera.zoom = zoom;
    camera.position.x = 0;
    camera.position.y = 0;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }

  function gestureState(): { distance: number; x: number; y: number } | null {
    const [a, b] = [...pointers.values()];
    if (!a || !b) return null;
    return {
      distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
    };
  }

  let previousX = 0;
  let previousY = 0;
  let previousTime = 0;
  let frame = 0;
  let disposed = false;

  function requestRender(): void {
    if (!frame && visible && !document.hidden && !disposed) frame = requestAnimationFrame(render);
  }

  function render(time: number): void {
    frame = 0;
    const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
    previousTime = time;
    if (automatic && !dragging) targetYaw += delta * 0.16;
    const smoothing = reducedMotion.matches ? 1 : 0.16;
    yaw += (targetYaw - yaw) * smoothing;
    pitch += (targetPitch - pitch) * smoothing;
    zoom += (targetZoom - zoom) * smoothing;
    finishUniforms.finishAmount.value +=
      (finishTarget.amount - finishUniforms.finishAmount.value) * smoothing;
    finishUniforms.finishTint.value +=
      (finishTarget.tint - finishUniforms.finishTint.value) * smoothing;
    applyView();
    panel.rotation.set(pitch, yaw, 0, 'YXZ');
    renderer.render(scene, camera);
    const settling =
      Math.abs(targetYaw - yaw) +
      Math.abs(targetPitch - pitch) +
      Math.abs(targetZoom - zoom) +
      Math.abs(finishTarget.amount - finishUniforms.finishAmount.value) +
      Math.abs(finishTarget.tint - finishUniforms.finishTint.value);
    if (automatic || settling > 0.0001) requestRender();
  }

  const resizeObserver = new ResizeObserver(() => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    fitCamera(camera.aspect);
    camera.updateProjectionMatrix();
    requestRender();
  });
  resizeObserver.observe(canvas);

  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      previousTime = 0;
      if (visible) requestRender();
      else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    { threshold: 0.05 },
  );
  visibilityObserver.observe(canvas);

  function onVisibilityChange(): void {
    previousTime = 0;
    requestRender();
  }
  document.addEventListener('visibilitychange', onVisibilityChange);

  function onWheel(event: WheelEvent): void {
    if (!active) return;
    event.preventDefault();
    automatic = false;
    const delta =
      event.deltaY *
      (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1);
    targetZoom = clampZoom(targetZoom * Math.exp(-THREE.MathUtils.clamp(delta, -240, 240) * 0.002));
    requestRender();
  }
  canvas.addEventListener('wheel', onWheel, { passive: false });

  function onPointerDown(event: PointerEvent): void {
    if (!active) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    dragging = true;
    automatic = false;
    previousX = event.clientX;
    previousY = event.clientY;
    gesture = gestureState();
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('is-dragging');
  }

  function onPointerMove(event: PointerEvent): void {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2) {
      const next = gestureState();
      if (gesture && next) targetZoom = clampZoom((targetZoom * next.distance) / gesture.distance);
      gesture = next;
    } else {
      targetYaw += (event.clientX - previousX) * 0.012;
      targetPitch += (event.clientY - previousY) * 0.009;
    }
    previousX = event.clientX;
    previousY = event.clientY;
    requestRender();
  }

  function release(event: PointerEvent): void {
    pointers.delete(event.pointerId);
    gesture = gestureState();
    const remaining = pointers.values().next().value;
    if (remaining) {
      previousX = remaining.x;
      previousY = remaining.y;
    }
    dragging = pointers.size > 0;
    if (!dragging) canvas.classList.remove('is-dragging');
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (!active) return;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', '+', '=', '-', '_'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    automatic = false;
    if (event.key === 'ArrowLeft') targetYaw -= 0.2;
    if (event.key === 'ArrowRight') targetYaw += 0.2;
    if (event.key === 'ArrowUp') targetPitch -= 0.2;
    if (event.key === 'ArrowDown') targetPitch += 0.2;
    if (event.key === '+' || event.key === '=') targetZoom = clampZoom(targetZoom * 1.2);
    if (event.key === '-' || event.key === '_') targetZoom = clampZoom(targetZoom / 1.2);
    if (event.key === 'Home') {
      targetYaw = -0.43;
      targetPitch = 0.12;
      targetZoom = 1;
    }
    requestRender();
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('lostpointercapture', release);
  canvas.addEventListener('keydown', onKeyDown);

  function onReducedMotionChange(): void {
    if (reducedMotion.matches) automatic = false;
    requestRender();
  }
  reducedMotion.addEventListener('change', onReducedMotionChange);

  return {
    setFinish(finish) {
      finishTarget = FINISH_OPTIONS[finish] ?? FINISH_OPTIONS.natural;
      requestRender();
    },
    activate() {
      active = true;
      automatic = !reducedMotion.matches;
      previousTime = 0;
      requestRender();
    },
    dispose() {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      reducedMotion.removeEventListener('change', onReducedMotionChange);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', release);
      canvas.removeEventListener('pointercancel', release);
      canvas.removeEventListener('lostpointercapture', release);
      canvas.removeEventListener('keydown', onKeyDown);
      geometries.forEach((geometry) => geometry.dispose());
      wood.dispose();
      steel.dispose();
      steelTexture.dispose();
      texture.dispose();
      renderer.dispose();
    },
  };
}
