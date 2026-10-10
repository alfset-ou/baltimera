'use client';

// The boot script must run before the first paint, so it is the first element in
// <body>: React keeps inline scripts where they are rendered and the browser
// executes it while parsing, before any page content exists.
export const INTRO_BOOT_SCRIPT = `(()=>{const root=document.documentElement,prefersReduce=window.matchMedia('(prefers-reduced-motion: reduce)');
const revealsPossible=!prefersReduce.matches&&'IntersectionObserver' in window;
if(revealsPossible)root.classList.add('motion-ready');
const revealWatchdog=()=>setTimeout(()=>{if(window.__baltimeraReveals)return;if(root.classList.contains('intro-active')){revealWatchdog();return}root.classList.remove('motion-ready')},4000);
if(revealsPossible)revealWatchdog();
let seen=false;try{seen=sessionStorage.getItem('baltimera-intro-seen')==='1'}catch{}
if(seen||prefersReduce.matches)return;
root.classList.add('intro-active');
try{sessionStorage.setItem('baltimera-intro-seen','1')}catch{}
let done=false;const finish=()=>{if(done)return;done=true;window.__baltimeraIntroDone=true;root.classList.remove('intro-active');window.dispatchEvent(new Event('baltimera:intro-complete'))};
setTimeout(finish,2450);
document.addEventListener('keydown',event=>{if(event.key==='Escape')finish()});
prefersReduce.addEventListener('change',event=>{if(event.matches)finish()})})();`;

declare global {
  interface Window {
    /** Set by the boot script the moment the entrance finishes. */
    __baltimeraIntroDone?: boolean;
    /** Set by the client effects once they own the reveal animations. */
    __baltimeraReveals?: boolean;
  }
}
