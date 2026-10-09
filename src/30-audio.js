// Procedural audio: Web Audio sfx + lookahead-scheduled music. Every entry point is try-wrapped (never throws).
const AU = (() => {
  // voices render at time `at`, transposed by `pitch`, into node `out` (set by play / the music scheduler)
  let ctx, comp, noise, musBus, out, at, track, next, step, last, timer, cur, voices, pitch;
  const rnd = Math.random, TYPES = 'sawtooth square triangle bandpass'.split(' ');
  const floats = (n, fn) => new Float32Array(n).map(fn);
  // letter value: 'a' = 0
  const C = (s, i) => s.charCodeAt(i) - 97;

  // One voice: wave w (0-2 osc, 3 bandpass / 4 lowpass noise, 5 random crackle), f→g Hz sweep (pitch or cutoff),
  // d secs, peak v, delay s, envelope shape a (≤.1 percussive, ~.2 sustained, ~2 swell)
  const voice = (w, f, g, d, v, s = 0, a = 0) => {
    if (voices < 64) {
      const t = at + s, e = ctx.createGain(), n = w > 2 ? ctx.createBufferSource() : ctx.createOscillator(),
        curve = (p, fn) => p.setValueCurveAtTime(floats(99, fn), t, d);
      let x = n;
      if (w > 2) { n.buffer = noise; n.loop = 1; n.connect(x = ctx.createBiquadFilter()); }
      // (lowpass is the filter default)
      w < 4 && (x.type = TYPES[w]);
      curve(x.frequency, (_, i) => w > 4 ? rnd() * 4e3 : pitch * f * (g / f) ** (i / 98));
      curve(e.gain, (_, i) => v * (w > 4 ? rnd() < .2 : (i /= 98) ** a * (1 - i) ** (a > .1 ? .5 : 4)));
      x.connect(e).connect(out);
      voices++; n.onended = () => voices--;
      n.start(t, rnd()); n.stop(t + d);
    }
  };
  // Sound code (made by scratchpad encode.mjs): voices split by ' ', each = wave digit + 6 chars
  // (from, to, dur, vol, delay, shape; value = 2^((charCode-97)/8)/4; freqs are ×pitch, ~1e4).
  // Trailing letters = arpeggio in semitones ('a' = 0) with 'to' as the step time.
  const run = r => r.split(' ').map(t => {
    const [, f, g, d, v, s, a] = [...t].map(c => 2 ** (C(c) / 8) / 4), n = t.slice(7);
    [...n || 'a'].map((c, i) => voice(+t[0], c = f * 2 ** (C(c) / 12), n ? c : g, d, v, s + i * g, a));
  });

  // (k s h = music drums)
  const SFX = {
    shot: '4nIai(( 2D1[k(( 3fcIc((',
    empty: '3miAn((',
    reload: '3YQRf(( 3a]Nk[(',
    hit: '1RAUc(( 3cVQf((',
    kill: '4k6hi(( 2A.ck(( 1UNYRN(aem',
    hurt: '0L4fi(( 5<<eeN(',
    civ: '0F(^[((ab 0D(e[`(ab',
    bomb: '3Aims(y 4f4vkl( 2=-skl( 0E(yUl^aehmq',
    beep: '1ZZQc((',
    talk: '1LLI^((',
    boss: '0M`^e((afafaf',
    win: '1OV^Y((aehm 2O(q]f^aehm',
    lose: '0LchY((hgfe 2<4scs(',
    start: '1VTc[((af 2RRaV^(aehm',
    heal: '2ONc`((aehmqt',
    glitch: '5<<im((',
    k: '2A1^T((',
    s: '3^U[N((',
    h: '3pnLA((',
  };

  // Music: one char per 16th step. Letters = scale degrees ('a' = root), '-' holds, '.' rest. Drums: k s h.
  // Andean pan-flute motif (minor pentatonic)
  const FLUTE = 'e---h-g-e---d-c-d-----c-a-------';
  // [step secs, scale: semitones above A1 as letters (key + mode), chord per bar, bass, arp, lead, drums]
  const ACTION = [.115, 'fhikmnp', 'afdg', 'aaha', 'ahchehch', FLUTE, 'k.hhs.hk'];
  // 0 title, 1-3 levels (shared driving track), 4 boss
  const TRACKS = [[.16, 'moprtuw', 'afcg', 'a-h-', 'acehjhec', FLUTE, 'k...s...'], ACTION, ACTION, ACTION,
    [.09, 'hjkmops', 'aafe', 'aaha', 'ahehahfh', '', 'kkhsk.hs']];

  // Lookahead scheduler: runs every 50 ms, schedules notes 200 ms ahead on the audio clock
  const tick = () => {
    const [d, sc, prog, ...parts] = track, now = ctx.currentTime;
    if (next < now) next = now + .05;
    for (pitch = 1e4, out = musBus; next < now + .2; next += d, step++) {
      at = next;
      parts.map((q, k) => {
        let c = q[step % q.length], j = 1;
        if (k > 2) SFX[c] && run(SFX[c]);
        else if (c > '`') {
          // bass + arp follow the chord progression
          c = C(c) + (k < 2) * C(prog, step / 16 % prog.length);
          const f = .0055 * 2 ** (k + (c / 7 | 0) + C(sc, c % 7) / 12);
          while (q[(step + j) % q.length] == '-') j++;
          // saw bass, square arp, triangle pan flute + breath noise
          voice(k, f, f, j * d, [.03, .015, .045][k], 0, k > 1 && .2);
          k > 1 && voice(3, f, f, j * d, .015, 0, .2);
        }
      });
    }
  };

  const music = n => {
    try {
      if (n === cur && timer) return;
      cur = n; timer = clearInterval(timer);
      musBus?.disconnect();
      if (track = TRACKS[n]) {
        (musBus = ctx.createBiquadFilter()).frequency.value = 2500; musBus.connect(comp);
        next = step = 0; timer = setInterval(tick, 50); tick();
      }
    } catch {}
  };

  return {
    init(c) {
      try {
        if (c != ctx) {
          const w = c.createWaveShaper();
          // master compressor → soft limiter / master gain (output can never exceed tanh(1.28) ≈ 0.86)
          (comp = c.createDynamicsCompressor()).connect(w).connect(c.destination);
          w.curve = floats(257, (_, i) => Math.tanh(i / 100 - 1.28));
          (noise = c.createBuffer(1, 4e4, 4e4)).copyToChannel(floats(4e4, () => rnd() * 2 - 1), 0);
          ctx = c; last = {}; voices = 0; musBus = timer = clearInterval(timer); music(cur);
        }
        // (rnd doubles as a no-op rejection handler)
        c.resume().catch(rnd);
      } catch {}
    },
    play(n) {
      try {
        const t = ctx.currentTime;
        // per-sound rate limit: spamming shot/talk every frame can't stack voices
        if (SFX[n] && !(t - last[n] < .035)) { last[n] = at = t; pitch = 9200 + rnd() * 1600; out = comp; run(SFX[n]); }
      } catch {}
    },
    music,
  };
})();
