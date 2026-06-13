// src/hooks/useKeySound.ts
// Generates a mechanical keyboard click via Web Audio API — no audio files needed.
// Space press uses a lower-pitched thud; regular keys use a crisper click.

import { useRef, useCallback } from 'react';
import { useSoundStore } from '../store/soundStore';

export function useKeySound() {
  const enabled = useSoundStore(s => s.enabled);
  const ctxRef = useRef<AudioContext | null>(null);

  return useCallback((isSpace = false) => {
    if (!enabled) return;

    try {
      if (!ctxRef.current || ctxRef.current.state === 'closed') {
        ctxRef.current = new AudioContext();
      }
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const duration = 0.04; // 40 ms — snappy click

      // White noise burst with exponential decay
      const bufSize = Math.ceil(ctx.sampleRate * duration);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-(i / bufSize) * 28);
      }

      const source = ctx.createBufferSource();
      source.buffer = buf;

      // Bandpass shapes the noise into a "click" character
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = isSpace ? 820 : 2200;
      filter.Q.value = 1.8;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(now);
      source.stop(now + duration + 0.01);
    } catch {
      // AudioContext unavailable (e.g. browser policy)
    }
  }, [enabled]);
}
