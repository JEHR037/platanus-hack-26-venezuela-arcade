// Arcade cabinet button → keyboard key mapping.
// The physical cabinet sends these exact key codes.
// DO NOT modify this mapping — it matches the real arcade cabinet wiring.
// To add local testing shortcuts, append keys to an array (never replace).
const CABINET_KEYS = {
  P1_U: ['w'], P1_D: ['s'], P1_L: ['a'], P1_R: ['d'],
  P1_1: ['u'], P1_2: ['i'], P1_3: ['o'],
  P1_4: ['j'], P1_5: ['k'], P1_6: ['l'],
  P2_U: ['ArrowUp'], P2_D: ['ArrowDown'], P2_L: ['ArrowLeft'], P2_R: ['ArrowRight'],
  P2_1: ['r'], P2_2: ['t'], P2_3: ['y'],
  P2_4: ['f'], P2_5: ['g'], P2_6: ['h'],
  START1: ['Enter'], START2: ['2'],
};

const KEY_TO_ARCADE = {};
for (const code in CABINET_KEYS) {
  for (const key of CABINET_KEYS[code]) KEY_TO_ARCADE[key.length === 1 ? key.toLowerCase() : key] = code;
}

// held[code]: button is down. pressed[code]: went down since last consumed (edge).
const held = Object.create(null);
const pressed = Object.create(null);
const keyCode = e => KEY_TO_ARCADE[e.key.length === 1 ? e.key.toLowerCase() : e.key];
window.addEventListener('keydown', e => {
  const c = keyCode(e);
  if (!c) return;
  if (!held[c]) pressed[c] = true;
  held[c] = true;
  e.preventDefault();
});
window.addEventListener('keyup', e => {
  const c = keyCode(e);
  if (c) held[c] = false;
});

// btn: level-triggered. hit: edge-triggered, consumes the press.
const btn = c => !!held[c];
const hit = c => {
  if (pressed[c]) { pressed[c] = false; return true; }
  return false;
};
// Drop stale presses (e.g. when switching screens).
const clearHits = () => { for (const c in pressed) pressed[c] = false; };

// Persistent storage: arcade parent bridge, falling back to localStorage, then memory.
const memStore = {};
const store = {
  async get(k) {
    try {
      if (window.platanusArcadeStorage) return await window.platanusArcadeStorage.get(k);
      const raw = window.localStorage.getItem(k);
      return raw === null ? { found: false, value: null } : { found: true, value: JSON.parse(raw) };
    } catch (e) {
      return k in memStore ? { found: true, value: memStore[k] } : { found: false, value: null };
    }
  },
  async set(k, v) {
    memStore[k] = v;
    try {
      if (window.platanusArcadeStorage) return await window.platanusArcadeStorage.set(k, v);
      window.localStorage.setItem(k, JSON.stringify(v));
    } catch (e) { /* memory only */ }
  },
};
