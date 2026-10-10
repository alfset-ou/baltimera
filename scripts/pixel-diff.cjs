// Pixel diff between the designer's build and the Next.js build.
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatchModule = require('pixelmatch');
const pixelmatch = pixelmatchModule.default ?? pixelmatchModule;

const dir = path.resolve(__dirname, '..', '.verify');

function diff(aName, bName) {
  const a = PNG.sync.read(fs.readFileSync(path.join(dir, aName)));
  const b = PNG.sync.read(fs.readFileSync(path.join(dir, bName)));
  if (a.width !== b.width || a.height !== b.height) {
    console.log(`${aName} vs ${bName}: SIZE MISMATCH ${a.width}x${a.height} vs ${b.width}x${b.height}`);
    return;
  }
  const out = new PNG({ width: a.width, height: a.height });
  const diffPixels = pixelmatch(a.data, b.data, out.data, a.width, a.height, { threshold: 0.05 });
  const total = a.width * a.height;
  fs.writeFileSync(path.join(dir, `diff-${aName}`), PNG.sync.write(out));

  // Vertical bands keep long pages readable: report rows where pixels differ.
  const bands = [];
  const bandHeight = Math.max(1, Math.floor(a.height / 40));
  for (let band = 0; band < 40; band++) {
    const top = band * bandHeight;
    const bottom = Math.min(a.height, top + bandHeight);
    let count = 0;
    for (let y = top; y < bottom; y++) {
      for (let x = 0; x < a.width; x++) {
        const i = (y * a.width + x) * 4;
        if (out.data[i] === 255 && out.data[i + 1] === 0 && out.data[i + 2] === 0 && out.data[i + 3] === 255) count++;
      }
    }
    if (count > total * 0.00005) bands.push(`y${top}-${bottom}:${count}`);
  }
  console.log(`${aName} vs ${bName}: diff ${diffPixels}/${total} = ${((diffPixels / total) * 100).toFixed(3)}%`);
  console.log(`  different bands: ${bands.length ? bands.join(' ') : 'none'}`);
}

for (const view of ['desktop', 'tablet', 'mobile']) {
  diff(`dist-${view}.png`, `next-${view}.png`);
}
