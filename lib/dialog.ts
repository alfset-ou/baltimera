import type { MouseEvent as ReactMouseEvent } from 'react';

// Native <dialog> helpers. Only one dialog is open at a time and the page
// behind it must stop scrolling, exactly like the designer's app.js did.

export function openDialog(dialog: HTMLDialogElement): void {
  if (!dialog.open) dialog.showModal();
  document.body.classList.add('dialog-open');
}

export function closeDialog(dialog: HTMLDialogElement): void {
  if (dialog.open) dialog.close();
  if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open');
}

/** Dialog backdrops: a click that lands outside the panel closes it. */
export function isBackdropClick(
  dialog: HTMLDialogElement,
  event: ReactMouseEvent<HTMLDialogElement>,
): boolean {
  if (event.target !== dialog) return false;
  const rect = dialog.getBoundingClientRect();
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}
