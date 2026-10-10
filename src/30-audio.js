// Procedural audio: Web Audio sfx + lookahead-scheduled music. Every entry point is try-wrapped (never throws).
const AU = (() => {
  // voices start at time `at`, frequencies scaled by `pitch` (set by play / the music scheduler)
  let ctx, comp, noise, at, next, step, last, timer, cur, pitch;
  const rnd = Math.random, TYPES = 'sawtooth square triangle bandpass'.split(' ');
  const floats = (n, fn) => new Float32Array(n).map(fn);
  // letter value: 'a' = 0
  const C = (s, i) => s.charCodeAt(i) - 97;

  // One voice: wave w (0-2 osc, 3 bandpass / 4 lowpass noise, 5 random crackle), f→g Hz sweep (pitch or cutoff),
  // d secs, peak v, delay s, envelope shape a (≤.1 percussive, ~.2 sustained, ~2 swell)
  const voice = (w, f, g, d, v, s = 0, a = 0) => {
    const t = at + s, e = ctx.createGain(), n = w > 2 ? ctx.createBufferSource() : ctx.createOscillator(),
      curve = (p, fn) => p.setValueCurveAtTime(floats(99, fn), t, d);
    let x = n;
    // (noise buffer is 5 s of ±.5: no loop needed for a random start ≤ 1 s)
    if (w > 2) { n.buffer = noise; n.connect(x = ctx.createBiquadFilter()); }
    // (lowpass is the filter default)
    w < 4 && (x.type = TYPES[w]);
    curve(x.frequency, (_, i) => w > 4 ? rnd() * 4e3 : pitch * f * (g / f) ** (i / 98));
    curve(e.gain, (_, i) => v * (w > 4 ? rnd() < .2 : (i /= 98) ** a * (1 - i) ** (a > .1 ? .5 : 4)));
    x.connect(e).connect(comp);
    n.start(t, rnd()); n.stop(t + d);
  };
  // Sound code (made by scratchpad encode.mjs): voices split by ' ', each = wave digit + 4-6 chars
  // (from, to, dur, vol[, delay, shape]; value = 2^((charCode-97)/8)/4; freqs are ×pitch, ~1e4).
  // Trailing letters (after all 7 chars) = arpeggio in semitones ('a' = 0) with 'to' as the step time.
  const run = r => r.split(' ').map(t => {
    const [, f, g, d, v, s = 0, a] = [...t].map(c => 2 ** (C(c) / 8) / 4), n = t.slice(7);
    [...n || 'a'].map((c, i) => voice(+t[0], c = f * 2 ** (C(c) / 12), n ? c : g, d, v, s + i * g, a));
  });

  // (k s h = music drums)
  const SFX = {
    shot: '4nIaq 2D1[k 3fcIk',
    empty: '3miAv',
    reload: '3YQRn 3a]Ns[',
    hit: '1RAUc 3cVQn',
    kill: '4k6hq 2A.ck 1UNYRN(aem',
    hurt: '0L4fi 5<<emN',
    civ: '0F(h]((ab',
    bomb: '3Aim{(y 4f1vul 0E(yUl^aehmq',
    beep: '1ZZQc',
    talk: '1LLI^',
    boss: '0M`^e((afafaf',
    win: '1OV^Y((aehm 2O(q]f^aehm',
    lose: '0LchY((hgfe 2<4scs',
    start: '1VTf]((af',
    heal: '2ONc`((aehmqt',
    glitch: '5<<iu',
    k: '2A1^T',
    s: '3^U[V',
    h: '3pnLI',
  };

  // Music: one theme in A minor (Am F C G). One char per 16th step; letters = semitones above E ('a' = E),
  // '-' holds, '.' rest. Bass + arp are transposed by the bar's chord root; the arp uses only root/5th/octave/9th
  // so every chord stays in key. Parts: [chord roots per bar, bass, arp, Andean pan-flute lead, drums k s h].
  // n = 0 title: slow, no drums; 1-3 levels and 4 boss: drums, tempo rising with n.
  const THEME = ['fbid', 'aama', 'amhmomhm', 'm---r-p-m---k-i-k-----i-f-------', 'k.hhs.hk'];

  // Lookahead scheduler: runs every 50 ms, schedules notes 200 ms ahead on the audio clock
  const tick = () => {
    // 16th-note step: .16 s title, then faster each level up to .093 s for the boss
    const [prog, ...parts] = THEME, now = ctx.currentTime, d = .16 - cur / 60;
    if (next < now) next = now;
    for (pitch = 1e4; next < now + .2; next += d, step++) {
      at = next;
      parts.map((q, k) => {
        let c = q[step % q.length], j = 1;
        if (k > 2) cur && SFX[c] && run(SFX[c]);
        else if (c > '`') {
          // bass + arp follow the chord progression
          c = C(c) + (k < 2) * C(prog, step / 16 % 4);
          // E2 for the bass, an octave up per part
          const f = .00824 * 2 ** (k + c / 12);
          while (q[(step + j) % q.length] == '-') j++;
          // saw bass, square arp, triangle pan flute + breath noise
          voice(k, f, f, j * d, [.03, .015, .045][k], 0, k > 1 && .2);
          k > 1 && voice(3, f, f, j * d, .03, 0, .2);
        }
      });
    }
  };

  const music = n => {
    try {
      if (n === cur && timer) return;
      // stopping only stops scheduling: notes already queued (≤ 200 ms) ring out
      cur = n; timer = clearInterval(timer);
      if ([1, 1, 1, 1, 1][n] && ctx) {
        next = step = 0; timer = setInterval(tick, 50); tick();
      }
    } catch {}
  };

  return {
    init(c) {
      try {
        if (c != ctx) {
          // master compressor → soft limiter / master gain (output can never exceed tanh(1.28) ≈ 0.86);
          // `noise` briefly holds the shaper before it becomes the noise buffer
          (comp = c.createDynamicsCompressor()).connect(noise = c.createWaveShaper()).connect(c.destination);
          noise.curve = floats(257, (_, i) => Math.tanh(i / 100 - 1.28));
          (noise = c.createBuffer(1, 2e5, 4e4)).copyToChannel(floats(2e5, () => rnd() - .5), 0);
          ctx = c; last = {}; music();
        }
        // (rnd doubles as a no-op rejection handler)
        c.resume().catch(rnd);
      } catch {}
    },
    play(n) {
      try {
        const t = ctx.currentTime;
        // per-sound rate limit: spamming shot/talk every frame can't stack up voices
        SFX[n] && (t - last[n] < .035 || (last[n] = at = t, pitch = 9200 + rnd() * 1600, run(SFX[n])));
      } catch {}
    },
    music,
  };
})();
