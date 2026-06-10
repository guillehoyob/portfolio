/**
 * WHITE NOON — Hum (BREAK-8) — the field's voice, synthesized, OFF by law
 * Two sounds only, both born from an oscillator (zero assets, zero deps):
 *  - the click-ripple's soft water blip (90ms, −28dB effective)
 *  - the breath crest's long low exhale (700ms, even quieter)
 * ma is silence: flags.sound is FALSE by default; this module only loads for the
 * owner's audition via ?fc-sound=1 (or if he ever blesses the flag). AudioContext
 * is created lazily on the first GESTURE (autoplay policy). Never under RM-off?
 * — sound is an explicit opt-in, so reduced motion does not gate it; closing the
 * tab is the off switch (no persistence until the owner approves a toggle).
 */
import { registerCleanup } from './index.js';

export function initHum() {
  let ac = null;
  const ctx = () => (ac ||= new (window.AudioContext || window.webkitAudioContext)());

  const blip = (f0, f1, ms, vol) => {
    try {
      const a = ctx(), t = a.currentTime;
      const o = a.createOscillator(), g = a.createGain(), lp = a.createBiquadFilter();
      o.type = 'sine';
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f1, t + ms / 1000);
      lp.type = 'lowpass'; lp.frequency.value = 900;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(1e-4, t + ms / 1000);
      o.connect(lp); lp.connect(g); g.connect(a.destination);
      o.start(t); o.stop(t + ms / 1000 + 0.02);
    } catch { /* no audio — silence is the default state anyway */ }
  };

  const onClick = (e) => {
    if (e.target.closest && e.target.closest('a,button,input,textarea,select,label,[role="button"]')) return;
    blip(520, 480, 90, 0.04); // the ripple, heard
  };
  const onCrest = () => blip(330, 310, 700, 0.02); // the exhale, barely

  addEventListener('pointerdown', onClick, { passive: true });
  document.addEventListener('fc:crest', onCrest);
  registerCleanup('hum', () => {
    removeEventListener('pointerdown', onClick);
    document.removeEventListener('fc:crest', onCrest);
    if (ac) { try { ac.close(); } catch { /* */ } }
  });
}
