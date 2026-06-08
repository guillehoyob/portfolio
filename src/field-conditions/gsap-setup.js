/**
 * WHITE NOON — shared GSAP setup (the one motion grammar)
 * Registers CustomEase + SplitText (both free in GSAP 3.13+) and defines the
 * single signature ease 'run' = cubic-bezier(0.22,1,0.36,1) as the GSAP default,
 * so every JS tween rides the exact same curve as the CSS --ease-run tokens
 * (craft §1). Call setupGsap() once before any other GSAP work.
 */
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { SplitText } from 'gsap/SplitText';

let ready = false;
export function setupGsap() {
  if (ready) return gsap;
  ready = true;
  gsap.registerPlugin(CustomEase, SplitText);
  CustomEase.create('run', '0.22,1,0.36,1');
  gsap.defaults({ ease: 'run' });
  return gsap;
}

export { gsap, SplitText };
