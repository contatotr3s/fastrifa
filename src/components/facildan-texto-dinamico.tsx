'use client';

import React, { useEffect, useRef } from 'react';

interface FacildanTextoDinamicoProps {
  words?: string[];
  effect?: 'typewriter' | 'wave' | 'flip3d' | 'decrypt' | 'slot' | 'elastic';
  hold?: number;
  speed?: number;
  variant?: 'plain' | 'chip';
  className?: string;
  style?: React.CSSProperties;
}

const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#0123456789ABCDEF';

export default function FacildanTextoDinamico({
  words = ['vapt-vupt', 'rápido', 'na hora', 'prático', 'fluido'],
  effect = 'typewriter',
  hold = 1800,
  speed = 0.6,
  variant = 'plain',
  className = '',
  style,
}: FacildanTextoDinamicoProps) {
  const chipRef = useRef<HTMLElement>(null);
  const wordRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const chip = chipRef.current;
    const wordEl = wordRef.current;
    if (!chip || !wordEl || !chip.animate) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isPlain = variant === 'plain';

    let index = 0;
    let timer: NodeJS.Timeout | number = 0;
    let busy = false;
    let animId = 0;
    let isMounted = true;

    const dur = (ms: number) => Math.max(10, Math.round(ms / Math.max(0.2, speed)));

    const letters = (word: string): HTMLElement[] =>
      [...word].map((ch) => {
        const el = document.createElement('span');
        if (ch === ' ') {
          el.className = 'is-space';
          el.innerHTML = '&nbsp;';
        } else {
          el.textContent = ch;
        }
        return el;
      });

    const measure = (word: string): string => {
      const probe = document.createElement('b');
      probe.className = 'facildan-textodinamico__probe';
      probe.append(...letters(word));
      chip.append(probe);
      const fs = parseFloat(getComputedStyle(chip).fontSize) || 16;
      const width = probe.getBoundingClientRect().width / fs;
      probe.remove();
      return `${width.toFixed(3)}em`;
    };

    const resetWord = () => {
      if (chip.getAnimations) chip.getAnimations().forEach((a) => a.cancel());
      if (wordEl.getAnimations) wordEl.getAnimations().forEach((a) => a.cancel());
      [...wordEl.children].forEach((c) => {
        const htmlChild = c as HTMLElement;
        if (htmlChild.getAnimations) htmlChild.getAnimations().forEach((a) => a.cancel());
        htmlChild.style.opacity = '1';
        htmlChild.style.transform = '';
        htmlChild.style.filter = '';
      });
      wordEl.style.transform = '';
      wordEl.style.opacity = '1';
      wordEl.style.filter = '';
    };

    const triggerSpeaking = () => {
      if (isPlain) return;
      chip.classList.remove('is-speaking');
      void chip.offsetWidth;
      chip.classList.add('is-speaking');
    };

    const next = async () => {
      if (!isMounted || words.length < 2 || busy) return;
      const currentAnimId = ++animId;
      busy = true;

      const nextIndex = (index + 1) % words.length;
      const nextWord = words[nextIndex];

      try {
        switch (effect) {
          case 'typewriter': {
            const cur = wordEl.textContent || '';
            const cursor = document.createElement('span');
            cursor.className = 'facildan-cursor';

            // Apaga letra a letra
            for (let i = cur.length; i >= 0; i--) {
              if (currentAnimId !== animId || !isMounted) return;
              const p = cur.slice(0, i);
              wordEl.replaceChildren(...letters(p), cursor);
              wordEl.style.width = measure(p);
              await new Promise((r) => setTimeout(r, dur(32)));
            }

            if (currentAnimId !== animId || !isMounted) return;
            wordEl.style.width = measure(nextWord);
            triggerSpeaking();

            // Digita letra a letra
            for (let i = 1; i <= nextWord.length; i++) {
              if (currentAnimId !== animId || !isMounted) return;
              wordEl.replaceChildren(...letters(nextWord.slice(0, i)), cursor);
              await new Promise((r) => setTimeout(r, dur(50 + Math.random() * 25)));
            }

            if (currentAnimId !== animId || !isMounted) return;
            cursor.remove();
            break;
          }

          case 'flip3d': {
            if (!isPlain) {
              chip.animate(
                [{ transform: 'none' }, { transform: 'scale(0.98)' }, { transform: 'none' }],
                { duration: dur(600) }
              );
            }
            const outA = wordEl.animate(
              [
                { opacity: 1, transform: 'translateY(0) rotateX(0deg)' },
                { opacity: 0, transform: 'translateY(-55%) rotateX(85deg)' },
              ],
              { duration: dur(260) }
            );
            await outA.finished.catch(() => {});
            if (currentAnimId !== animId || !isMounted) return;
            wordEl.replaceChildren(...letters(nextWord));
            wordEl.style.width = measure(nextWord);
            triggerSpeaking();
            const inA = wordEl.animate(
              [
                { opacity: 0, transform: 'translateY(55%) rotateX(-85deg)' },
                { opacity: 1, transform: 'translateY(0) rotateX(0deg)' },
              ],
              { duration: dur(380) }
            );
            await inA.finished.catch(() => {});
            break;
          }

          case 'decrypt': {
            wordEl.style.width = measure(nextWord);
            triggerSpeaking();
            const steps = Math.max(6, Math.round(14 / Math.sqrt(speed)));
            for (let step = 0; step <= steps; step++) {
              if (currentAnimId !== animId || !isMounted) return;
              const resolved = Math.floor((step / steps) * nextWord.length);
              let txt = '';
              for (let i = 0; i < nextWord.length; i++) {
                txt +=
                  i < resolved
                    ? nextWord[i]
                    : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
              }
              wordEl.replaceChildren(...letters(txt));
              await new Promise((r) => setTimeout(r, dur(26)));
            }
            break;
          }

          case 'slot': {
            const oldCh = [...wordEl.children];
            triggerSpeaking();
            const outs = oldCh.map((el, k) =>
              (el as HTMLElement).animate(
                [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-100%)' }],
                { duration: dur(220), delay: k * dur(18) }
              )
            );
            await Promise.all(outs.map((a) => a.finished)).catch(() => {});
            if (currentAnimId !== animId || !isMounted) return;
            const fresh = letters(nextWord);
            wordEl.replaceChildren(...fresh);
            wordEl.style.width = measure(nextWord);
            const ins = fresh.map((el, k) =>
              el.animate(
                [{ opacity: 0, transform: 'translateY(100%)' }, { opacity: 1, transform: 'translateY(0)' }],
                { duration: dur(380), delay: dur(50) + k * dur(22) }
              )
            );
            await Promise.all(ins.map((a) => a.finished)).catch(() => {});
            break;
          }

          case 'elastic': {
            const oldCh = [...wordEl.children];
            const outs = oldCh.map((el, k) =>
              (el as HTMLElement).animate(
                [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.3)' }],
                { duration: dur(200), delay: k * dur(12) }
              )
            );
            await Promise.all(outs.map((a) => a.finished)).catch(() => {});
            if (currentAnimId !== animId || !isMounted) return;
            const fresh = letters(nextWord);
            wordEl.replaceChildren(...fresh);
            wordEl.style.width = measure(nextWord);
            triggerSpeaking();
            const ins = fresh.map((el, k) =>
              el.animate(
                [
                  { opacity: 0, transform: 'scale(0.2)' },
                  { opacity: 1, transform: 'scale(1.25)', offset: 0.65 },
                  { opacity: 1, transform: 'scale(1)' },
                ],
                { duration: dur(480), delay: dur(60) + k * dur(30) }
              )
            );
            await Promise.all(ins.map((a) => a.finished)).catch(() => {});
            break;
          }

          case 'wave':
          default: {
            if (!isPlain) {
              chip.animate(
                [{ transform: 'none' }, { transform: 'scale(0.95, 1.04)' }, { transform: 'none' }],
                { duration: dur(820) }
              );
            }
            const oldCh = [...wordEl.children];
            const outs = oldCh.map((el, k) =>
              (el as HTMLElement).animate(
                [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-0.35em)' }],
                { duration: dur(240), delay: k * dur(16) }
              )
            );
            await Promise.all(outs.map((a) => a.finished)).catch(() => {});
            if (currentAnimId !== animId || !isMounted) return;
            const fresh = letters(nextWord);
            wordEl.replaceChildren(...fresh);
            wordEl.style.width = measure(nextWord);
            triggerSpeaking();
            const ins = fresh.map((el, k) =>
              el.animate(
                [{ opacity: 0, transform: 'translateY(0.45em)' }, { opacity: 1, transform: 'none' }],
                { duration: dur(520), delay: dur(100) + k * dur(40) }
              )
            );
            await Promise.all(ins.map((a) => a.finished)).catch(() => {});
            break;
          }
        }
      } catch (_) {
        // silencioso
      }

      if (currentAnimId !== animId || !isMounted) return;
      resetWord();
      wordEl.replaceChildren(...letters(nextWord));
      wordEl.style.width = measure(nextWord);
      index = nextIndex;
      busy = false;
    };

    const schedule = () => {
      clearTimeout(timer as NodeJS.Timeout);
      if (!isMounted || document.hidden || reduce.matches || words.length < 2) return;
      timer = setTimeout(async () => {
        await next();
        schedule();
      }, hold);
    };

    // Inicialização da primeira palavra
    wordEl.replaceChildren(...letters(words[0]));
    wordEl.style.width = measure(words[0]);

    schedule();

    return () => {
      isMounted = false;
      clearTimeout(timer as NodeJS.Timeout);
    };
  }, [words, effect, hold, speed, variant]);

  const classes = [
    'facildan-textodinamico',
    variant === 'plain' ? 'facildan-textodinamico--plain' : '',
    'pointer-events-none cursor-default font-bold',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      ref={chipRef}
      className={classes}
      style={{
        color: '#0869f5',
        cursor: 'default',
        pointerEvents: 'none',
        ...style,
      }}
      aria-live="polite"
    >
      <span ref={wordRef} className="facildan-textodinamico__word font-display font-bold text-[#0869f5]">
        {words[0]}
      </span>
    </span>
  );
}
