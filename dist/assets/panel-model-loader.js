const viewer = document.querySelector('#panel-model');
if (viewer) {
  const gate = viewer.querySelector('.model-entry');
  const canvas = viewer.querySelector('canvas');
  const label = gate.querySelector('.model-entry-label');
  const swatches = [...viewer.querySelectorAll('[data-finish-choice]')];
  const fallback = viewer.querySelector('.model-fallback');
  for (const swatch of swatches) swatch.addEventListener('click', () => {
    const finish = swatch.dataset.finishChoice;
    viewer.dataset.finish = finish;
    for (const button of swatches) button.setAttribute('aria-pressed', String(button === swatch));
    fallback.src = `assets/panel-cad-preview-v19-${finish}.webp`;
    viewer.dispatchEvent(new Event('model:finish'));
    load();
  });
  let loading, requested = false;
  gate.hidden = false;
  function activate() {
    if (!requested || !viewer.classList.contains('model-ready')) return;
    viewer.classList.add('model-active');
    canvas.tabIndex = 0;
    gate.disabled = true;
    gate.setAttribute('aria-hidden', 'true');
    viewer.dispatchEvent(new Event('model:activate'));
    canvas.focus({preventScroll: true});
  }
  function load() {
    if (loading) return loading;
    loading = import('./panel-3d.js?v=24').then(() => {
      if (!viewer.classList.contains('model-ready')) throw new Error('WebGL unavailable');
      activate();
    }).catch(() => {
      viewer.classList.add('model-unavailable');
      gate.hidden = true;
      canvas.tabIndex = -1;
    });
    return loading;
  }
  gate.addEventListener('click', () => {
    requested = true;
    if (viewer.classList.contains('model-ready')) activate();
    else {
      gate.disabled = true;
      label.textContent = 'Загружаем модель…';
      gate.setAttribute('aria-busy', 'true');
      load();
    }
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      load();
    }, {rootMargin: '300px'});
    observer.observe(viewer);
  }
}
