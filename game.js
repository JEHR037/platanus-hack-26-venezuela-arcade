// ARRIVALS: LA INVASIÓN — Platanus Hack 26 Caracas Arcade Challenge
// Built from the src/ modules. Edit src/, not this file.
(() => {
'use strict';
// ---- 00-input.js ----
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

// ---- 10-assets.js ----
// Low-res art (palette PNGs) from the author's Arrivals art + procedural pieces; upscaled at boot by nnUp.
// Every PNG starts with the same 18 bytes, so only the tails are stored and ASSETS gets full data URIs.
const ASSETS = {};
for (const [k, v] of Object.entries({
  fornax: 'ACgAAAAwBAMAAACRVSWoAAAAFVBMVEUUDRvJn4/IPNiDamVkQToyISEAAAGIvYqpAAABxUlEQVR42p3NMW4cMQwF0B9kpTrC+AQ5wQ4kpx5DX65peDi1AFu6/xFCZnaNGE6VX1DgEynhfzL/QV3mF7ukdO2fLb6k9EXf0lJYP2usuR1zjvWTLoIZp+q6/bX9q7PhnTry8YHf4iB1px7v+W4xz4shVQWvctdrNCRrE+zXjyfjZU3LmpoGLfcnRfaR0gMbg9TT4hOkHj2BrBC9YYHm7UiXn2wIcuL4AV1rSaSjAn7zbRN9WkqqhduJJFeR6Jgf1mdDgWMJGl/TY9WUj3DHxxDwtsicL0s8UclNA4b0XcbWzRQgKRqOPuu6bLhjLRBID/V4uqJD1RDhYRjOoTEAYzvx4qhHEETESzvxu6Nuw5vB1nFDhRDQMHc2xuDri99RJuKgBZZwWUQxqBa357k/QkNqGn2PO1mvc88ZEjKPXrjRIzDLCDnXcjCzspbnQTrWnJmL+mGpRoXIZ7xj9pAZXpXeeCltr7mg+J8u1Umttgjm21Qq9KNgdviAN7Wok8wJwMZ3ZhPbbEYdjk132/ff20kWtz9hi0ZnVB1UoTEC84bVSCaCwtKBAMBMIEH3ZiVCDTsytQfrqQKNQQBjWw0qNqi+q47jN6Lyn6EBU53/AAAAAElFTkSuQmCC',
  sumer: 'ACgAAAAwCAMAAABUpcipAAAAFVBMVEUEAgQQGyBOJiZ+PTOsYUbbkXb2xqwEpWAMAAABqUlEQVR42p3UQYokSRJE0fctou9/4Ck3md0UpJMwtK4fogIKWv6/6d/CAYTf4ercFXf9Dtcn2rT+rN/gzsfdkXvL9Rs8Z38+PcVp91d48nzlj50PPLcBcACif4K7O/h8BcAXQAdz59yHT9rnecPCLvuc3bq66gYowKdrZ3ffw32W8e3Pz8TlUY9/wjl3Ows/YV3mcwCHPaz9hNtnCcCs5Z0I+auuWC9osBun/acTjQY4AIy13XEasPyAgXCmgJZel5lGWAXAC0LCOOCJn6tXjVNRd5A3xABgY4Y3hDH788gG4d1xTRzyW+LgYmy7dzQv+K4ZexK84WOA8EC8V/MHOudkF/ZODDx3g90J78uMmowxRPoJATUDEhajAzCkBIjsgvgLC0wVoT2Lpb/QzAlQsVsGOOicuHAkErsjFXxVGOcRkOxezZJbPueEhbMRst0538NVk75wadkGGs4HNnmWL1i41te2TZ9gRG3/C6TtnJQBJuC4+xxG4Xx+/e+tr10pwXsy14577e0qIJI6NxUJA8EIsN3EBwkM7xZbmS8JwOIlg3McP2YCgP0Xucj5sEO+IpgAAAAASUVORK5CYII=',
  phaenon: 'ACgAAAAwCAMAAABUpcipAAAAFVBMVEUSDh8xSVFvmqa34e9t/1o6GGAAAABCcmJAAAABWklEQVR42u3O2Y3DMBAE0e4as/MPeSEeog/JTmDrQwTEh+Hov14kJfnNoKpQfjiXXUfONxaqXCPl3qnOKHS3bFw71ulbtwVAFdFr7YUB7oIPyAMwVcgMGF1lY9mFZR4PsO7kw3JvQA1mf0ieIHaiG+kO51dKki3voJ6KbX/AUSZJFCmhrqD6ZXdQKHFtiBccRuN+hWam47HLpGzGCRlc2a7OvCGs3QdVMhG9c8fyvB8uT/t1tyBVSTRxr66g+yLKNDKYDfu1WpOq50QyQ1i12pDqJapdOCEL7h9PAW9QrqsAGcpHgJqoO+lg6PSA7yLxlOUcp2xJFy/jWsUwZqrVt0hMWT9hOYk61HeIokRq50Ri+GCFjlprEvMJk1xAT6nGcMch3iED9qebbeQ19gNaWkOPoArFR1xM1Jho2fuQvKFkT9i6gAFnvLgNLeAZmp48HWpr5IQ7bJ+u/gDaRwv1yyXvQwAAAABJRU5ErkJggg==',
  vidnah: 'ACgAAAAwBAMAAACRVSWoAAAAFVBMVEUKEwht9q+OvcYNzGM+jGAoXUYZOCEHC5d8AAABy0lEQVR42l3Qu67bMAwGYBaIuSvO6dwIyZlryM2ci3xmNRE1s2nE93+EUlKcS3/bEPCBNAVCS+c9w3vw5MbMbyJycs6Z/tfTpNpgjOnDC160zLiSh8rfh7mfM2Y3VBvMC55qnSl5ohua9a/tTq2S50WY0fS1f+QZKtb+cvGAPGPv1HYA8HsF/QOHvhh/MxbWq+egUQ8x1vLZhoZauNfjtjwq+s871kL4s/RWs21oxtriKUS7SVPDvq3cdgA5gTQcI2gwCwqgcMNdqMgRb96LNCSuGCKenPu64wQVidANZsb9A+Mw7BvOoRvmwQV+w3QN+TImeAvF712c+D/kLaA+LaEdks983M64uqNE/2Mxt7tRMiVGoSOjInJBzejdlMM5dIxSmmAwigknYgwM5/UygIAzvdMP2w6I1maPkA5a6laHHZToos8eAbpBSz/GXCekbK2icNeb8YuHvRoyyZkFRNBsEoDhggmJkBUXH+12+nYUABZOUUBKKDFcPxXjpQJjZYbjhgH9VDETUSQRtDZw5z0UOyz9up+IO0W5NYxm6U3vSTZHGzDf0VOm6NPVbhQlF8xtOJFVZBSOBXOqfz5aaz2DCBYk8RpbMhXkfy8EkjjZKjIgAAAAAElFTkSuQmCC',
  qawakun: 'ACgAAAAwCAMAAABUpcipAAAAHlBMVEUbDiUuFFENST0piXRP88Wn73D0/vDZ8xsLBRf4wQyxNL8WAAABUElEQVR42qSUgYqGMAyDl6bT7f1f+ExgMh38Di541MOP5G91Lf8RsMFM+qZ6/8liKHqPH7YAuWolgcihmG5t+owV8FbmHE+DTIaEmAqTJjkMHRwSyanEMxy3IRmADRHkZGnxNmTAtBkEb0sa1OBsSJjKS2ZBW2qs5qBbmhPErDV9Y5KyAQzCUeIEkfoTbFIhuMGkLQ1W+hJow9HP6IQqmcdRacOqdFuqGOQwvOyO4+jRWgub5rCkQBuCECgSrZk0GKCfG/QIBbqNZpnkaCdTYCRDoqdXWivs5SJJ5v0oUGRoObmKOM+u4uywMl+gk/t5qtQX+IwWUbp/wDN6aUazsfhoZh3PTXIdzzzwSpNBPga+vkKKZeX6Cvc/igJ+f2bE9oe7fRQMfh8u7B/X/QVgYXelbC4pk5trb3+R7q/m7WU/ox9YXirXVa3i/6Tyt2EIAM4/D1Q/YY7OAAAAAElFTkSuQmCC',
  phelios: 'ACgAAAAwCAMAAABUpcipAAAAFVBMVEUjDiimwO6oR7RVapBnJmc1QFkDAQN7rW7nAAABgElEQVR42o3TB5KFMAyDYTmyfP8j72oMhHjr/yrhm9AxqzPMNlMEHSVhy+kYZ5q0maIjf6OFuF3FKw5ZijsofpbFvWK4iPrOMXg6RqCm6xXThR4Hj7DHT1onFClJnHNS8DeeSGYmL7IhDCXdTnZb8ra9FQ7opGvbbOeCfKAdnEQbmlKO4Jba0MIbI28onRAdGbFhU76gRBUJsG9HtZvQgxEVAaT4T8i/YDdgd0AKAn6EPKBk2OQNReE7KE1YVQ/MbKhvIApXola6/B5iQ66WMCAPiFdkvqCd9APsKQG6rYaDWl6OeEEMKHLxCtAOZ4aPq+lqQwN1ODc8pFrWZxC53YApOnlkO0DTrZdk11BG8HbarbzlDZ8py6GhXaIlcLstIUANPykA03k7SM42kXFByG22fclwGS50kvmooHxgIrMhMCxAeSKzhk4FFDTKhi2vUIUqyWPbLYTjlSRRInXAzFzgfpDXIlcvRpDpZOegve/e/t6c0nvjsQuKOmC+oVn3AeVyE9RN7q+DAAAAAElFTkSuQmCC',
  lukxed: 'ACgAAAAwCAMAAABUpcipAAAAFVBMVEUPDxbVs6LMXeKQdWiFJ6dfSkI2LjBeyA4TAAABhUlEQVR42s3TC4rDRhgE4f7drrr/iTeRZsAILJnwzgfsgFT0sAjn/4PSFv5DNl3MM3fQliq/u2JnisHcM5GWtpz0cY91yhZ6H8Iql7XG9HHQ0GIOmA75Qvdju9CatPnSQ/z8S3te724eY/o+ZHnXmC9Icnav08xxvrkN8VxZVn0eXIJXFv/+/omXp+v5+BUeJru8e3ehUWFd/JbjdjB5bpcgmh8ogFbb/KYmGPixtppTNI+YmXaWdfjUdbYpcBy547nGnmrLeXI/lzZ2tnSGfn8Da1pE2FtOE6diLjQULEnc79bfYjFXAgJmS42xAbz5KKjXHxEK5EMNPeC+WdquM3293tlcIp2pgkKbGCa8Xi+v4b5weoC2xjjEIyTR+JGTLGo6de8kXrTFbFkdn6F4RedUV9mq9CbcQ7RDOx0V3OKNdDQZpNbchiAyORQpifdhEWd6kkaQr3DvaPekIqAYb+5Wm8NuACF+49TSA7LzeIeWzd/h50JkeQ6F0urKjM9hC+yOTv8FdmIVxPypmUcAAAAASUVORK5CYII=',
  drone: 'ABgAAAAYCAMAAADXqc3KAAAAG1BMVEUKBRINCBUfHCg2KkxQTWBttCyMe7fI/1r/T9iZxEYMAAAAAXRSTlMAQObYZgAAAI5JREFUeNqVkQEKg0AQA282e+r/X9ygWoMtlA6EDRkF0PEDiBawbWRLsRElTOsQakaCRN40xHm8YvQplp1uvu5PA+fYjuBa0WJU3eWoBHZI6v3xdc7ZspDhLWquiw16CjziqFLY1NyhUti0epr2ngKbKgfv3AJkPJUpuARjQJ3AODYccyq4v3X8be4+/ucFSOsD08D/p0oAAAAASUVORK5CYII=',
  trooper: 'ABgAAAAgCAMAAAA/gEgKAAAAGFBMVEUKBRIIBRAgMjA1jjFHXmRR5Gp4jZSt1eJ0gAFsAAAAAXRSTlMAQObYZgAAAL5JREFUeNpiIA4A2CAPJIthKISNiMK7/41381t6ta3HwAA8n8/ME2JpRe7ABDLcQMCZuRGwM70TtulqvYJuhCTczDsl3hViHM4K/kELk3zceV+F2nTdgvHOUmK0rbOuYzbAsoRk2a7ETPOOxWoCIaxbVyTAuzp4F44q+YVljxs05VIUDbZ6AgRLVC5AFKicJbSG/b9fkPD2ysVd+YgvJjs4EnaBR4DaL/AE8rVkOYHCPnPyOHVwzruD8Dc8SR4A+xAEL6vajnoAAAAASUVORK5CYII=',
  vandal: 'ABgAAAAgCAMAAAA/gEgKAAAAGFBMVEUKBRL/ehqEiZS6LyZPTlKFHxkvIiQLBQ3xO2V4AAAAAXRSTlMAQObYZgAAAMRJREFUeNq1zoGGBEEQg+Ht6r+S93/jiy4zdnYdBxeolg/p17/F/qWnnuKXJx9gTCJZPEGkU+hjw2sFqFVt+wlYFYi3H7AJVJg3MWsBAWm3evsNRAC5d9/glpBIL9I/QBbT7+SCndo6mr7vcWfQJ2IHpk+cwQE6/b7A7sRJ6j0vp3cxoQ7UScR15QBwwfk6SO6ebwg80xI+0AiQApGJBYUpZvyOtcEG3toBaSa/wZ7zDXP/DM1yjnMe/dq1nFP1se7kPskPeRcIOorXP1gAAAAASUVORK5CYII=',
  purun: 'ABgAAAAgCAMAAAA/gEgKAAAAG1BMVEUKBRINCBQ2LD1VS1aHaFKUiHesqn/azKj/sh6waIpeAAAAAXRSTlMAQObYZgAAAN9JREFUeNoFwYeB3EAMADGQCv3Xe2/tGAAAADAwQAAwmAf4CwAX8wBNALjBoAMAbvQBAODGfm/jBwAs+I0fAGCMpw8IgGYeJXANzqB/M8+kZgExyj5DJwCDzjkzd8W1mKgS1wgzWJNOYM2wO6yfLSzWrNmlz+sDlsWmmfH5gBkWUGbOIGBx4FSl1sANOFMAYIk/TpXq7IEFqhAccM0EDRgwuObZUfcO3Tvk2bEvBYWKl9Odc6D2IOQc1xGsYoMjtqMywECHVhVlhsxSNWBe+Gbh+8INdKjtNAUGzIA2KPwHJ4+jHydwJ0wAAAAASUVORK5CYII=',
  civ: 'ABAAAAAgCAMAAAAsVwj+AAAAGFBMVEUKBRINCBUsHShEND14YVO6nHHo2LHIRjrcFUwRAAAAAXRSTlMAQObYZgAAAIJJREFUeNqtjgUCw0AIBLMC/f+LY/Soeyd6g04biBVgGiB2jD4XNobIooVTmboQnVGABaYW3miBNftKKA8bic44ikTvQYBylIAdGaSjRTjCJIZgirtQNQEi6RDBkaKwZEMlYEG0qVFCSQQodddCvTxUSXUuAXT8j6Je7wo0d0Sbeq0sy14Dqzchyc8AAAAASUVORK5CYII=',
  boss: 'ADAAAAAwBAMAAAClLOS0AAAAGFBMVEUKBRKwyPZthrGiR6xFVnVnLmoyMUcNBxMZCHiRAAAAAXRSTlMAQObYZgAAAdxJREFUeNps0DGzmzAMB3A2z6bv0hkfl7fXpdmJYj5AapibKvLq90Ksr1+ZkitO+h/wnX6SraMqw1z9N6w1b21Tr7XYa73Wv7QklnUl/bsFvpbwIaVW5zSxHJCJJtff6vA8YEwG0MMWZgDTZKg/igkFZ9/LXXWzv+xK8FfQtTE14hvFDZxGwsYYs0dnYAPziXluTAsOXV/Crkm9ANETXLSm3kBLhE9QP4BMAbDvkwAI9G0BS+sC6AoYiVrEDAMXW2WADBhK6PwDeAtKAP8CMRf/yo6frQOB8ATH730/ALoXANNCcgguFSD7BgrSL0c58RMcJwCgkIp1bz8AAgI4ImYOG/AIA+Z6KkDZLgFcgAQc8rAFpnyRBF3awBcbaA0OePj3hLXkx8DoyAGdVlDMAt1VgH9bIDgvoPjTaF2DOULft0dLeLILpEa/EQKBtd9aA97bq5/yQGDTAknOtsvfc+cFJCkQQc656wCc9+MDRkSAeQA/2hmAPK9wHzEkmB2NfCNPdD/YLuY3iOdhSHztPE/kp5s9sF+B39+Z7767T1MabocYU4YqEcxMwpyuUTFFNXGVo4LjELi6T4pjpTxXPMZFIs8hSoP0SivPseJqjVo6WIblEHjNsk31Z3gBAKA70JemFmIIAAAAAElFTkSuQmCC',
  ship: 'AEAAAAAgCAMAAACVQ462AAAAElBMVEUKBRINChJRUluLmJTl5fWM/zry/R61AAAAAXRSTlMAQObYZgAAAXVJREFUeNq11YGGREcYBeGv+u77P/FOnwCGMViJFDSocn7Q/iv5I8HE/h7ImwdeHl77a6DHFz4K/eWw5+8BfRgvHjAIXgyAvstvdj02gIzZl0DCgBJmgAYZhgEEhAe7gMKAYBlky7sc5OGVwbkduBAT2EAGBoicHV5AhQ1hK9h8MCA9m+P11jdkTAuMmE9foeMOiiEYhWtwNt8X0Nv6fMemOIzX1wB0XMRbdoDXgcb9PEICYSUTMx1uwe+D2fgSODAsBKPDlZvjF6Au4LhrVHa6EzQQMmCdl8By1aW4WDVCaKPYDsOAhC2Oezlh3ISAJgwEU3AdYx7urWCO34gwgQwgAtcK87hz4L0ACEAMOgy2EUZEm+Dux0LeDJmDDThmitj7IeRzgSx4xfDjl2dAsMmdAAHBPCa8xEZwIIOhO8Kb/PwyAVZs0HHL9vObjBl++GQM3xlmmYHwJtjnpEF1nQveOudLH9/ZHdg2gP70I0LmX1D5f/kHYPziH3ZWDc8AAAAASUVORK5CYII=',
  car: 'ACAAAAAUCAMAAADbT899AAAAHlBMVEUKBRIREBs4PUtdWmR7eoWSiZKkpKzGPDnIyM71a1Ef4D47AAAAAXRSTlMAQObYZgAAAJJJREFUeNqtjAsKhTAMBN181vb+F35JyrMSka8DEtYZenwJOt2Ozr1ISydVAkBM2huwVOTyCN8DpKGWF9NeYEEpLD6XBNhWVG1saF4X4WMFI7+Nm3EFIN2tOAv+qRWBXZxzzgxGUsFsQeJXoOuFKFTVEueTDBRAFSpPIkgNwXsQhQIHXohg3WD/amude9rWBkBfPyyjBnMeCBI3AAAAAElFTkSuQmCC',
  moto: 'ABIAAAAUCAMAAAC3SZ14AAAAG1BMVEUKBRINCBQaGh9AQEhyc32enKTOWFTAwMjQ0NqlO9HnAAAAAXRSTlMAQObYZgAAAHRJREFUeNoFwYFtwzAABDGebGT/eYtEX5ICANTjNwBwGKgA5Vw4toEOgdlAATAg9EH7GxC9wBdG6GVc2ITeLwXcvcDjdwq7Dj3ozYBXGbDpq6dO3Jjm894X8KPnFlWHu+nU7DpogDF7MBtJd/OAAS4AQKfwD/A1NzlXe/N0AAAAAElFTkSuQmCC',
  bg3: 'AFAAAAA8CAMAAADG+c2+AAAAFVBMVEUMFSEcKjotPFFESmxZbolqRm6hVHu7cgVXAAADEklEQVR42q3PgcojuRGF0XOrnbz/+2atG2BJgWD+hsnOAZoSLn9I+TerwAEY0vT0OQoxfuGwxs8GIAcI796DkyCMad/Wx3twgCj6TUhCjHf4WOpS8jXzre/7c84dRJG6nUfHOQTkrWODCqgb3/EtArz3NtiXzS8+/gLy2lrj1cxXCso5x/++UGtN8ffW/gFA1FJXTatuyEc4lrma+pwTKSBWReM2Q7+Htn5UsuOKFnfu+8F8Aw0MbtNSQNzl26mBhzs1Mzue0AK5e+rSI7OtShjbBMYptbnV1n02MWiNKoFbe+DW3jX0VJAPSk5NIFa+tIAQcACCAK08DhuUUw8IiKNUkRwkv+6VygN8IKrhDFStKICKFrfaHPIBSssEFKs2NK0VRCHDHUSrGAKoxXEj1uMXQUdBEgC12h9qiNn2GXBiFQJCAqQAQoCKEG2A8AQV+g3ohFhKawVQQjRgIIgJoAeYlFh1LPLDPAzac+AcmRqAWhFrJRbtIEDSfgCcJu6X0QNSRJMKFTRVw4iVDIAvzF2kTqeQDqBBlY8zuYKbQI/rKMApGABFIQ9xB3USgNMtXr4NCUAp+CCMhdEWMM/zaC0Ks1O12wvgsUImICpIiEunIEUxKXwAcZlREA0oASgO2RUwimAQtwwg1QTaAag4DbUYi1gix7/yBSgGJYCGQ/0YfCyT5zH/EQkE7Iki4qaxBBA60DISxTGVUEhBaMseEgiQqwlakSA9lSSoFbRFuFs8hBWMAEkGbROJFa5bCcQdvK9MKFNJK6D37/mbwH53KhDUzjlJWxOUiEtLiIoNapQEKKgkNDgJ7M4qhfv1JQUBUJCxKnUVC3fx8WsRSVACRIHcPXF/V2pHRFU+f8kmSiohFKsEsa6diEKTCgEcVJBENS9BqZUoVASCUkC4pwriZ2FFDaoAotAJK95EoICEqpKoqBWCx4sQuAVCAhR2ihdBgLKzQklKiQog3qXGnaygCqGiBAi8mwpoERDSKtydwLtAClu0Q63fCK4SKzTQ3wjG74kVCkjj/xSs+OfGHxZ/+Ir/BT/fnQX9tar+AAAAAElFTkSuQmCC',
})) ASSETS[k] = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA' + v;

// ---- 20-nn.js ----
// Qawakun neural 4x upscaler v2 ("depixelize"). A tiny CNN on RGBA (four 3x3 conv layers of 8 channels + ReLU, then a
// 1x1 to 48; 2,480 weights at 5 bits) looks at each low-res pixel's 9x9 neighbourhood and, for each of its 4x4 output
// sub-pixels, predicts softmax blend weights over the 4 low-res pixels of that sub-pixel's quadrant (centre, horizontal,
// vertical and diagonal neighbour). Trained on vector scenes rendered both as pixel art and as antialiased HD (plus the
// author's art), it turns stair-steps into straight diagonals and smooth curves. The output is a premultiplied convex
// blend of input colours, so edges stay crisp with no ringing or halos, and alpha gets the same smooth contours.
function nnCore(src, w, h) {
  const F = Float32Array, S = [.0692,.0217,.161,.0407,.105,.0826,.0682,.0443,.392,.186], n = w * h, W = w * 4, d = new Uint8ClampedArray(n * 64),
    C = (v, m) => v < 0 ? 0 : v < m ? v : m - 1;
  let o = 0, z = 0, v = 0, ci = 4, pw = w + 8, ph = h + 8, a;
  // layers 3x8, 3x8, 3x8, 3x8, 1x48: 5-bit codes packed 6 bits per char ('0'..'p' minus backslash), weights [ky][kx][in][out]
  // then biases, each with its own scale (v only needs its low 11 bits, so int32 overflow in << is harmless)
  const P = [3,3,3,3,1].map((k, l) => [k, ...[k * k * ci * (ci = l > 3 ? 48 : 8), ci].map((m, b) => new F(m).map(c => (
    z < 5 && (c = 'M23f`O1m8?Hje7`Rn[h`O1;i=8^lH?K3Bh^NnL<ZNkKg?ac2ab=C=WaNo47iO1SX@MYlh?Q1nX`Jg3jjO=li>Njmi?Pnl7dK1lW`Lk3iCNbeSRb2TWD:6n:dM51;aY9gH65ZeNcRn[B<n:Ch_:[LX?Lid^Z[:B6VPQdXENfk7>MEl88Nk57_QJ3m@Na:k@JQ;0;Y1jT[6cKhYDiYG_:JChaMbe8>O1pF=Nfm7JK5lh>[Uie]Ck2?J?J3XaG9Zh?Hg4W>Q247`Tj[79R6;h>Pfdh^Fo39XU5lG`Nn[h^Po;iaLo3Xa2g<7^HNKi>Jnl7cRYX6^VcCI^VZ2X^]QU5^Nj[i=O1m7`K1mW_I6;5_MF;FbU9]8?Q6;g_K1m7>Jn]gAM5dVaLnm7aM23h^No;h^Nk3Z>S=eh`C1dW_Q>DI>Q>57]Pj]i>Rnm6BE8TG<Lf]H^T_3Ff>k<7_K:@WbC1JFA@o3GcNYRkaQ237aPM]8@HnJI@Y:Ch=Rg;V@PUdGBS:dVbTk3X_TYnF_O5Sh?Ln<G_O1dW_U24W>C6DIaZk37?NU]9@No36`U6;4=Q1m6@Tk<6`Q1CfeOB;f>PjdX^HneXaC5L7`Jk;U@L^mU>O9eHbU6<9?K247>Tjl6^O6e7;Nk4F`Q4ki;U1chAI1lI?VfDWbFFLh>No3i`PjlW>Hj[i?Q9Li^RbZX_Nne8>S1lX^LfdiaO64I<Jk3H<Nfe6aLpSmeY_?X_Nf;j`Y9SgaDnl5CFo4V^RbmI`H^d5aJo2WAM1m7>To49`Q=lj@Fnl:AHkKi?P^cj^Y:D6BG62J=U1dE=Pj[6>P_3GaJne6eM=LK?LnSVaTblX>PbdHDK2<:DDjcf@Rc39?Hn[V`Jbd8?NgDH?O6CGbS23WeQ645`H_SF^VjL2@NnmgaG5mGPW>[9aDk4H?XnmWdHkD6`To[I;Vnd8@I=dX;PkK2YK:4S=WFSY?C5[U@QFTH[J^4F?W1f7?PjSHCOAe4HY217ALk3X^HoDh`Q2Bi@O9CgdNE3H=?6K8BS:;jb?9kUcM:SF]M1ljbPoT6AJj[i`Lne7@T^cW`M64H@U1m6?O63WAO62XBNj]6=M>KX`^6KYBI1dW^PflfdNn]GBP>CF`I2D<GNY^F:K2;G?WFJ7BA5E4bK>YE`O2[iAI>3i?M6:G^Nb[j]M5l7_Fg<8bO:;H@O2;U`Rbm6fM:4HCPfTIAG2<700NdVAQB47<Q2KYFS2EY_X_2gcRoD7CU:47?W2<G@Q6<HaNkDF`S2RZ>Hneh_EAkJDRk]VaTkSXZL^]H^S:47ZC=RYfPk47GW6DEbSFK6]Vnl7e<N47aM9mW^_Q]8_Pk3JBPnm7dTbch=Jfn9eO6;XAS5]GbP^mIeTg3idM247?U1liiK2[7gHgJfBM1[IDLc4F_PblVbVo5WbC6e5AO1mG`Hg;ggHYK<=OAlI`DnficRjFWXQEKXAHYm7;9F:gfV_dFbXV:k_M=DDaHndh@I=LW_L_45GUBCIYI^mXALfkG]Tk2hXPo48gO5dh[NRL7@Q5e6cRblXAQ1]G:Ng2X^W>46_RfBYcG:4H@Nk;h^S2DhCPg<9eK24GbO1m8]M24g?NX38aO><:>RfTGCC1dZbO>DG>Vo3X_PgT8YJcLE@M2;haRg;GAS=[i>8c=XAQ248<K1e7aM6LhaS9lX]Pk3idM5lW?S1eH@Q248@_<]iW0IJGUHo<3BTbQiZFnlgATfle_LMdWaK6;f`LQ[V`Jo<8?R_46@PgD8@Q1ld@PNDiARndh_K2DhbTQ3h;K1eE=PJ3haO1]3;N63iAO1KGXLo<7bVf;GTLo<FATnl6>Fjch?FbkW?Ffc6>Bbdh?LndW>Jo47?NnlX?LkLFbPb;W=I2<E?PYSH?G628`FnlbaPEcX=Jk;dBRUeFaU2<XbU1m6=Pc45aPMcf^F1bh_:j[F=JQ[7<FjSg_NjT7[Nndh=Njdh_Lo3caO23i@NN4WbU6<XbTndi?LjKV]Lbdi>LjKU;Lfdh>LbBf;HflW?JjK6]J^SgWNPld=PYYc9@920;@9ZAWB0QQ::E]4XLDK4:He'.charCodeAt(o++), v = v << 6 | c - 48 - (c > 92), z += 6),
    ((v >> (z -= 5) & 31) - 15) * S[l * 2 + b])))]);
  // input RGBA / 255 - .5, padded once by the receptive radius (clamp), then valid convs; ReLU is applied when reading
  a = new F(pw * ph * 4).map((_, i) => src[(C((i >> 2) / pw - 4 | 0, h) * w + C((i >> 2) % pw - 4, w)) * 4 + i % 4] / 255 - .5);
  P.map(([k, wt, b], l) => {
    const co = b.length, ci = a.length / pw / ph, ow = pw - k + 1, r = new F(ow * (ph -= k - 1) * co);
    for (let p = ow * ph; p--;) {
      const x = p % ow, q = p * co;
      r.set(b, q);
      for (let t = 0; t < k * k; t++) for (let i = 0, f = ((p - x) / ow * pw + x + (t / k | 0) * pw + t % k) * ci; i < ci; i++) {
        const v = a[f + i];
        if (v > 0 | !l) for (let j = co, u = (t * ci + i) * co; j--;) r[q + j] += wt[u + j] * v;
      }
    }
    a = r, pw = ow;
  });
  // output: sub-pixel (i, j) of LR pixel (x, y) = softmax-weighted premultiplied blend of C, H, V, D
  for (let p = n * 16; p--;) {
    const x = p % W >> 2, y = p / W >> 2, i = p % W & 3, j = p / W & 3, q = (y * w + x) * 48 + (j * 4 + i) * 3,
      X = C(x + (i > 1) * 2 - 1, w), Y = C(y + (j > 1) * 2 - 1, h) * w, t = [0, 0, 0, 0];
    let E = 0;
    [y * w + x, y * w + X, Y + x, Y + X].map((s, m) => {
      const g = m ? Math.exp(a[q + m - 1]) : 1, f = g * src[s *= 4, s + 3];
      E += g, t[3] += f;
      for (let c = 3; c--;) t[c] += f * src[s + c];
    });
    for (let c = 4; c--;) d[p * 4 + c] = c < 3 ? t[c] / t[3] : t[3] / E;
  }
  return { data: d, w: W, h: h * 4 };
}

function nnUp(img) {
  const c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: !0 }), w = c.width = img.width, h = c.height = img.height;
  x.drawImage(img, 0, 0);
  // the width argument resizes the canvas to 4x after the pixels were read
  x.putImageData(new ImageData(nnCore(x.getImageData(0, 0, w, h).data, w, h).data, (c.height *= 4, c.width *= 4)), 0, 0);
  return c;
}

// ---- 30-audio.js ----
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

// ---- 40-story.js ----
// STORY: authored branching dialogue. Choices set run flags → gameplay mods → endings.
// Qawakun keeps mission logs: newRun() reads the shared world memory, commit() files each run into it.
// Played heroes (fornax/sumer/lukxed) never speak as NPCs: Qawakun takes their lines and talks to them by name.
const STORY = (() => {
  // Text lives in tagged templates: the minifier keeps their raw UTF-8 (accents cost 2 bytes, not 4).
  const t = String.raw;
  // Speaker tags build dialogue lines: Q`text` → { who: 'qawakun', name: 'QAWAKUN', text }. R and X are portrait-less voices.
  const say = (who, name = who.toUpperCase()) => (s, ...v) => ({ who, name, text: t(s, ...v) });
  const W = ['qawakun', 'fornax', 'sumer', 'lukxed', 'vidnah', 'phelios', 'phaenon'], TRIO = W.slice(1, 4);
  const [Q, F, S, L, V, P, K] = W.map(w => say(w));
  const R = say(null, 'RADIO'), X = say(null, 'LOS PRIMEROS');
  const ENDS = [['luz', 'LA TIERRA HABLA'], ['adios', t`ADIÓS, GENERAL`], ['silencio', 'EL GRAN SILENCIO'], ['vidnah', 'LA RESTAURADORA']];
  const num = v => Math.min(99999, Math.max(0, Math.floor(v) || 0));
  const tag = v => (typeof v == 'string' ? v : '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  // Played heroes: any value → unique keys of the resistance trio, ['fornax'] when nothing valid is left.
  const cast = h => (h = [...new Set([].concat(h))].filter(x => TRIO.includes(x)))[0] ? h : ['fornax'];
  const crews = x => x == 1 ? 'un equipo' : x + ' equipos';
  const times = x => x == 1 ? 'una vez' : x + ' veces';
  const log = x => 'Registro ' + ('' + x).padStart(4, 0);

  // Flags f (choice index per beat): d intro, r market(0)/avenue(1), c civilians(0)/chase(1), v trust Vidnah(0),
  // l Lukxed covers the crew(0), p bribe Phaenon(0)/reveal Luphomoids(1)/no deals(2), z answer(0)/beacon off(1)/key to Vidnah(2).
  // The chase takes Fornax's escort (if Fornax is played: the escort of the Roraima base);
  // if Lukxed then covers the crew, nobody covers Fornax (or the base) and he (it) falls.
  const fellOf = f => f.c == 1 && f.l == 0;
  const turned = f => f.p == 1 && f.v == 0; // only Vidnah can confirm Luphomoids ride with los Primeros

  // Any stored value → well-formed world. c[0..6] = crews that: took the market (route 'metro'), saved civilians,
  // trusted Vidnah, had Lukxed cover them, bribed Phaenon, turned Phelios, let Fornax/the base fall. e = crews per ending.
  // lc = last crew's flags as digits d r c v l p z + outcome (0-3 ending, 4-6 fell in level 1-3, 9 unknown).
  const clean = w => {
    try {
      w = Object(w);
      const c = Object(w.c), e = Object(w.e);
      return {
        v: 1,
        n: num(w.n ?? w.runs),
        last: tag(w.last),
        lc: /^\d{8}$/.test(w.lc) ? '' + w.lc : '',
        c: [...Array(7)].map((_, i) => num(c[i])),
        e: ENDS.map((_, i) => num(e[i])),
      };
    } catch (_) { return clean(); }
  };
  // Any run with flags is usable; its world is re-validated on every call.
  const ok = r => r && r.f ? (r.w = clean(r.w), r) : STORY.newRun();
  // Community goal: trusting crews still needed (this one included) before Vidnah may use the key.
  // Unlocks once at least 5 crews, and a third of all crews, trusted her.
  const needOf = ({ n, c }) => Math.max(5 - c[2], Math.ceil((n - 3 * c[2]) / 2));
  const endOf = ({ f, w }) => f.z == 2 && f.v == 0 && needOf(w) < 2 ? 3 : f.z == 1 ? 2 : fellOf(f) ? 1 : 0;
  const dlg = (l, c = [], m = 4) => ({ lines: l.filter(Boolean).slice(0, m), choices: c });

  // A beat → [lines, choices, reactions per choice, flag key]. Falsy lines are skipped.
  const scene = (r, id) => {
    const { w, f } = r, n = w.n, lc = w.lc, k = w.c[2], need = needOf(w), fell = fellOf(f), vid = f.v == 0, h = cast(r.h);
    // hF: Fornax is in the field, so Qawakun gives the orders (C) and the base is what gets exposed (B).
    const [hF, hS, hL] = TRIO.map(x => h.includes(x)), C = hF ? Q : F, B = hF ? 'la base' : 'a Fornax';
    const su = f.c == 0 && !hS; // Sumer (NPC) rides with the crew
    // Qawakun's log of the previous crew: Registro 0042: el equipo VLD cayó en Caracas.
    const memo = lc[7] < 7 ? Q`${log(n)}: el equipo${w.last && ' ' + w.last} ${lc[7] > 3 ? t`cayó en ${['Caracas', 'el Metro', 'Roraima'][lc[7] - 4]}.` : lc[7] > 2 ? t`le dio la llave a Vidnah. Archivo sellado.` : t`ganó.`}`
      : Q`Probabilidad de éxito: 34%. Redondeando hacia arriba.`;
    switch (id) {
      case 'intro':
        return [[
          Q`Soy Qawakun, la IA que nació al unir todas las computadoras para romper QSHA-1024, el cifrado alienígena.`,
          Q`Así supimos que la radiación era un faro. Y los Primeros respondieron.`,
          X`¡FUERA! EL PARAÍSO NO ES DE USTEDES.`,
          Q`La radiación ciega sus visores; yo reconstruyo la imagen. Cada golpe daña nuestro enlace: la SEÑAL.`,
          hF ? Q`General Fornax, usted está al mando.` : F`Aquí el general Fornax, al mando de la resistencia.`,
          C`Los Primeros atacan la antena de El Ávila: sin ella, no hay SEÑAL. Defiéndanla y luego vayan a la base de Roraima.`,
        ], ['CON CAUTELA', 'A FONDO'], [
          [C`Con cautela: menos enemigos.`, memo],
          [C`A fondo: más enemigos. Ustedes sabrán.`, memo],
        ], 'd'];
      case 'l1a':
        return [[
          C`Mercado: combate cercano. Avenida: más enemigos, a distancia.`,
        ], ['POR EL MERCADO', 'POR LA AVENIDA'], [
          [C`Disparen rápido.`],
          [C`No se queden quietos.`],
        ], 'r'];
      case 'l1b':
        return [[
          C`¡La nave nodriza huye! Con ${hF ? 'la escolta de la base' : 'mi escolta'} pueden arrancarle un núcleo, pero ${hF ? 'la base queda' : 'yo quedo'} sin protección.`,
          ...hS ? [Q`Sumer: hay civiles atrapados, técnicos de mi antena. Si los salvan, reforzarán su enlace.`]
            : [S`Sumer, agente secreta. Norteamérica me envió: les falta potencia de fuego.`,
              S`Hay civiles atrapados. Si me ayudan a sacarlos, sigo con ustedes.`],
        ], ['SALVAR A LOS CIVILES', 'PERSEGUIR LA NAVE'], [
          [hS ? Q`Técnicos a salvo: SEÑAL extra para todos.` : S`Civiles a salvo. Voy con ustedes.`],
          [Q`Núcleo extraído: SEÑAL extra. Y sus drones pierden potencia.`, !hS && S`Vayan. Yo saco a los civiles... sola.`],
        ], 'c'];
      case 'l2a':
        return [[
          Q`Metro. Escolten a los civiles: aquí despierta un arma de los Primeros.`,
          V`Soy Vidnah, restauradora de los Primeros. Sanan la Tierra, pero sin ustedes. ¿Para qué un paraíso vacío?`,
          need < 2 ? V`Si confían en mí, al final sabrán qué más sé restaurar.`
            : V`Me faltan ${crews(need)} que confíen en mí para restaurar algo más que planetas.`,
        ], ['CONFIAR EN VIDNAH', 'NO CONFIAR'], [
          [V`En cada punto de control les restauro SEÑAL y revelo a los camuflados.`, su && S`Con ella no trabajo. Me voy a cuidar ${B}.`],
          [V`Como quieran. Los camuflados sí los verán a ustedes.`],
        ], 'v'];
      case 'l2b':
        return [[
          R`El enemigo está aquí: 5.143333°, -60.762500°.`,
          C`Ese mensaje unió al planeta contra la nave enterrada en Roraima. La resistencia los necesita en el tepuy.`,
          f.c == 1 && C`${hF ? 'General, la base sigue' : 'Sigo'} sin escolta.`,
          hL ? Q`Lukxed: desde el Kukenán cubres al equipo, o cuidas ${B}. No ambos.`
            : L`Lukxed, francotirador. Cubro al equipo o cuido ${B}. No ambos.`,
        ], [hL ? t`CUBRIR DESDE EL KUKENÁN` : 'QUE LUKXED NOS CUBRA', (hL ? 'CUIDAR ' : 'QUE CUIDE ') + (hF ? 'LA BASE' : 'A FORNAX')], [
          [hL ? Q`Kukenán: tiro limpio sobre el tepuy.` : L`Copiado. Ojos arriba.`,
            f.c == 1 && C`${hF ? 'La base queda sola' : 'Me cuido solo'}... ojalá baste.`],
          [C`Lukxed perdió su rango en Europa por quedarse aquí.`],
        ], 'l'];
      case 'l3a':
        return [[
          !fell ? Q`Aterrizó la nave del escudo: nada la frena. Baja su vanguardia.`
            : C`La nave del escudo aterrizó sobre ${hF ? 'la base' : t`mí`}. Sin escolta ni Lukxed... ${hF ? t`La base cayó, General` : t`Sigan sin mí. Es una orden`}.`,
          P`Phelios, de la dimensión zero. Mi piel ya está roja: odio todo lo vivo que no me contrató.`,
          K`Phaenon, de Kleper. Nada personal: vengo por el arma enterrada. O por cualquier botín.`,
          Q`Dato: los Luphomoides arrasaron el pueblo de Phelios. Según QSHA-1024, son parte de los Primeros.`,
        ], ['SOBORNAR A PHAENON', 'REVELAR: HAY LUPHOMOIDES', 'SIN TRATOS'], [
          [K`¿El arma enterrada, para mí? Trato hecho.`, P`¡Chatarra traidora! Entonces los aplasto yo.`],
          vid ? [P`¿Luphomoides con los Primeros? ¿Es cierto, Vidnah?`, V`Es cierto. Yo misma los he restaurado.`, P`Entonces mi guerra es con ellos. Phaenon es todo suyo.`]
            : [P`¿Luphomoides? ¿Sin pruebas? Buen truco.`, Q`Sin Vidnah como testigo, no había forma de probarlo.`],
          [P`Perfecto. Odio los tratos casi tanto como a ustedes.`],
        ], 'p'];
      case 'l3b':
        return [[
          turned(f) ? K`KLEPER... EL BOTÍN... ERA... JUGOSO...` : P`Mi piel... se vuelve gris. Nadie me contrató para perder.`,
          Q`Cuenta regresiva: 99%. Con la llave de QSHA-1024 puedo responderles o apagar el faro que los guía.`,
          vid && V`O denme la llave a mí. Sé restaurar más que planetas.`,
        ], ['RESPONDERLES', 'APAGAR EL FARO', ...vid ? ['DARLE LA LLAVE A VIDNAH'] : []], [
          [Q`Transmitiendo en su canal: "Armas en suspensión, apáguense. Esta Tierra tiene dueños."`],
          [Q`Apagando el faro. La Tierra deja de llamarlos.`],
          [need < 2 ? V`Cuento con ${crews(k + 1)} de mi lado. Es suficiente.` : V`Aún no: necesito ${crews(need - 1)} más de mi lado. Qawakun, respóndeles tú.`],
        ], 'z'];
      case 'end':
        return [[
          !fell ? C`${hF ? 'General, l' : t`Aquí Fornax. L`}o lograron. Hoy la resistencia duerme tranquila.`
            : hF ? Q`La base cayó, General, pero la resistencia sigue en pie.`
            : R`Mensaje grabado de Fornax: "Si oyen esto, ganamos. Lukxed: no fue tu culpa."`,
          vid ? f.z == 2 && need > 1 && V`Guardaré la llave. Cuéntenle a otros equipos: necesito que confíen en mí.`
            : su ? S`¿Eso era todo? Esperaba más acción.` : f.l == 0 && !hL && (!fell ? L`Buen tiro.` : !hF && L`...Copiado, general.`),
          r.x && Q`Discutieron ${times(r.x)} y aun así llegaron juntos.`,
          Q`${log(n + 1)} guardado. El próximo equipo sabrá lo que hicieron.`,
        ], []];
    }
  };

  return {
    newRun: (world, players, heroes) => ({ w: clean(world), p: players == 2 ? 2 : 1, h: cast(heroes), f: {}, x: 0 }),

    beat(r, id) {
      const s = scene(ok(r), id);
      return s ? dlg(s[0], s[1], id == 'intro' ? 6 : 4) : null;
    },

    choose(r, id, i, agree) {
      r = ok(r);
      const s = scene(r, id);
      if (!(s && s[1][0])) return null;
      i = Math.min(s[1].length - 1, num(i));
      r.f[s[3]] = i;
      const l = s[2][i];
      // 2P split vote: P1 wins, and every other time Qawakun files the complaint.
      if (agree === false && ++r.x % 2) l.unshift(Q`Votos divididos: decide el jugador 1.`);
      return dlg(l);
    },

    mods(r, lv) {
      r = Object(r);
      const f = Object(r.f), hS = cast(r.h).includes('sumer');
      const h = (f.d == 1 ? 1.1 : f.d == 0 ? .9 : 1) - (lv >= 2 && f.c == 1) * .1
        + (lv >= 3) * ((f.p == 1 && !turned(f)) * .15 + (f.p == 2) * .1 - (f.p == 0) * .1 + fellOf(f) * .05);
      return {
        route: f.r == 0 ? 'metro' : 'av',
        // A played hero is never the ally: if Sumer is played, the civilians she saves boost the link instead (+1 max SEÑAL).
        ally: f.v == 0 ? 'vidnah' : f.c == 0 && !hS ? 'sumer' : null,
        sniper: f.l == 0,
        boss: turned(f) ? 'phaenon' : 'phelios',
        hard: Math.round(100 * Math.min(1.3, Math.max(.8, h))) / 100,
        extra: lv >= 2 && (f.c == 1 || hS && f.c == 0),
      };
    },

    ending(r) {
      r = ok(r);
      const { f } = r, e = endOf(r), k = r.w.e[e], hF = cast(r.h).includes('fornax'), fell = fellOf(f);
      return {
        id: ENDS[e][0],
        // A played Fornax survives: what falls is the Roraima base.
        title: e == 1 && hF ? 'VICTORIA AMARGA' : ENDS[e][1],
        // story, a consequence line (luz/silencio), the sequel hook, Qawakun's tally; the secret ending closes on canon.
        lines: [
          ...[
            [t`La Tierra les responde en su canal: sus armas se apagan y la barra se congela en 99%.`],
            [t`La Tierra responde y sus armas se apagan. ` + (hF ? 'Pero la base de Roraima cae.' : t`Fornax no vivió para verlo.`)],
            [t`El faro se apaga y la nave del escudo da media vuelta. Estamos a salvo. Y solos.`],
            [t`Vidnah gira la llave: 99%... 50%... 0%. Restaura la Tierra sin echarnos, y lo que la medicina nos quitó.`],
          ][e],
          !(e % 2) && (fell ? (hF ? 'La base' : 'Fornax') + t` cayó en el intento.`
            : f.p == 0 ? t`Phaenon se fue con el arma enterrada. Volverá por más.` : turned(f) && 'Phelios caza Luphomoides entre las estrellas.'),
          (fell && !hF ? 'Qawakun' : 'Fornax') + ': Esto apenas empieza. Nos llaman desde Tokio y El Cairo.',
          k ? `Son el equipo ${k + 1} en ver este final.` : t`Son el primer equipo en ver este final.`,
          e > 2 && t`Antes de todo, solíamos llamarnos humanos.`,
        ].filter(Boolean),
      };
    },

    commit(world, r, name, score) {
      const w = clean(world), c = w.c;
      r = Object(r);
      const f = Object(r.f), d = x => x >= 0 && x < 9 ? x | 0 : 9;
      // Outcome: the ending if the crew chose at l3b, else the level where they fell (level 1 and 2 choices tell how far).
      const done = d(f.z) < 3;
      const e = done ? endOf(ok(r)) : 4 + (d(f.c) < 2) + (d(f.l) < 2);
      [f.r == 0, f.c == 0, f.v == 0, f.l == 0, f.p == 0, turned(f), fellOf(f)].forEach((x, i) => c[i] = num(c[i] + x));
      if (done) w.e[e] = num(w.e[e] + 1);
      w.n = num(w.n + 1);
      w.last = tag(name);
      w.lc = [f.d, f.r, f.c, f.v, f.l, f.p, f.z].map(d).join('') + e;
      return w;
    },
  };
})();

// ---- 50-game.js ----
// ARRIVALS: LA INVASIÓN — the game: title, hero select, co-op rail shooter, dialogue, HUD, continue, names, leaderboard.
{
// the minifier hands out its 54 one-letter names in declaration order, so the most used bindings are declared first
let md, G, S, lvl, mt, T, tP, stp, cam, bgSh, run, world, bg, DL;
let tm = 0, M = {}, scores = [];
// hot helpers and tables (the rest of the helpers follow below)
const BS = {};
// String.raw tag: the minifier keeps tagged templates as raw UTF-8 (accents cost 2 bytes, not 4)
const R = String.raw;
const PH = ['#D9F21B', '#FF4FD8'];
// players; K = cabinet codes for U D L R B1 B2 B3 START B4 B6
const P = [0, 1].map(i => ({ i, a: 0, rk: 0, fa: 0, h: i, cd: 0, C: [0xd9f21b, 0xff4fd8][i], H: PH[i], u: 169 + i * 462, n: 'P' + (i + 1), K: 'U D L R 1 2 3 START 4 6'.split(' ').map(s => s[1] ? s + (i + 1) : `P${i + 1}_${s}`) }));
const au = n => safe(() => AU.play(n));
const tx = (x, y, z, c = WH, s = '', ox = .5, oy = .5) => u(S.add.text(x, y, s, { fontFamily: 'Arial Black,sans-serif', fontStyle: 'bold', fontSize: z, color: c, stroke: STK, strokeThickness: z / 6 + 2, align: 'center', shadow: { offsetX: 2, offsetY: 3, blur: 4, stroke: 1, fill: 1 } }).setOrigin(ox, oy));
const { sin, max, min, random: rand, abs } = Math;
const pop = (x, y, s, c, z = 22, d = 900) => {
  const t = PO[poi++ % 16], W = S.tweens;
  W.killTweensOf(t);
  pos(t.setText(s).setColor(c).setFontSize(z).setStroke(STK, z / 5 + 3).setAlpha(1), cl(x, t.width / 2 + 20, 780 - t.width / 2), y);
  W.add({ targets: t, y: y - 50, alpha: 0, duration: d, ease: t => t * t * t });
};
// f(0) .. f(n - 1)
const rp = (n, f) => { for (let i = 0; i < n; i++) f(i); };
const rnd = (a, b) => a + rand() * (b - a);
// G = current Graphics target
const rect = (c, a, x, y, w, h) => G.fillStyle(c, a).fillRect(x, y, w, h);
const circ = (c, a, x, y, r) => G.fillStyle(c, a).fillCircle(x, y, r);
const vis = (a, v) => a.map(o => o.visible = v);
const GOLD = '#F8C20B';
// a vertical wall at lateral WX with alpha WA (set by the caller) from depth z0 to z1, height h0 to h1
const wall = (c, z0, z1, h0, h1, X = WX) => z1 > .45 && Q(c, WA, X, h0, z0 = max(z0, .4), X, h0, z1, X, h1, z1, X, h1, z0);
// place + scale (S defaults to s; no s means 1) + depth (none means 0)
const pos = (o, x, y, s, d, S) => o.setPosition(x, y).setScale(s, S).setDepth(d);
const PY = (h, z) => hy + (1 - h) * 330 / z;
const boom = (n, x, y) => em.explode(n, x, y);
const WH = '#fff';
// heroes: key, weapon, class, style, DAÑO, CADENCIA, ALCANCE (0-5), fire interval s, rounds, reload s
const HE = [['fornax', 'KEEPER X9', 'NUCLEAR', R`Misil guiado de área`, 4, 2, 3, .35, 6, 1.3],
  ['sumer', 'SIC KLE-A', R`PÓLVORA`, R`Ráfaga: x2 de cerca`, 2, 5, 1, .09, 18, 1],
  ['lukxed', 'RAILGUN SR', R`PÓLVORA`, 'Rayo perforante', 5, 1, 5, .6, 4, 1.6]];
const off = o => o.on = o.s.visible = 0;
const fx = (c, x, y, X, Y) => FX.push({ x, y, X, Y, c, t: .35 });
// STORY calls never break the game; d = fallback
const sto = (f, d, ...a) => safe(() => STORY[f](...a), d);
const up = s => (s + '').toUpperCase();
const OA = Object.assign;
const cl = (v, a, b) => v < a ? a : v > b ? b : v;
const mus = n => safe(() => AU.music(n));
const B = [];
const w = o => (WL.add(o), o);
const img = () => S.add.image(0, 0, 'p');
const stx = (o, k) => (MG.add(o), o.k = k, o.setTexture(tk(k)));
const PX = (x, z) => 400 + (x - cx) * 560 / z;
const mode = (m, t) => (md = m, mt = t, clearHits());
const kill = (e, p, s) => {
  e.de = .22; hs = .04; au('kill');
  boom(20, e.X, e.C);
  // fast kills pay more: points x 2 / (1 + ln(1 + seconds on screen)), in gold when x1.5 or better
  const f = 2 / (1 + log(1 + tm - e.b));
  p && addSc(p, e.d[2] * f + .5 | 0, e.X, e.Y - e.H, f < 1.5 ? p.H : GOLD);
  s && pop(e.X, e.Y - e.H - 20, up(s), WC[s]);
};
const { hypot, exp, ceil, log } = Math;
const TEAL = '#50F2C4', YEL = '#F2E205', RED = '#FF5A5A';
const HY = 232;
// modes
const TITLE = 0, PLAY = 1, DLG = 2, CONT = 3, NAMES = 4, END = 5, SEL = 6, SPL = 7;
const pick = a => a[rand() * a.length | 0];
const safe = (f, d) => { try { const r = f(); return r == null ? d : r; } catch (e) { return d; } };
const ah = j => hit(P[0].K[j]) | hit(P[1].K[j]);
const lc = (a, b, t) => { let r = 0; for (let s = 0; s < 24; s += 8) r |= ((a >> s & 255) * (1 - t) + (b >> s & 255) * t) << s; return r; };
const pad = n => ('' + n).padStart(7, 0);
const fsc = p => max(p.sc, p.bs | 0);
const RL = R`¡RECARGA! B2`, STK = '#14072b', PS = 'PULSA START';
const iaT = () => 'IA x4: ' + (ia ? 'ON' : 'OFF');
const WC = { qawakun: GOLD, fornax: PH[0], phelios: PH[1], sumer: TEAL, vidnah: '#73D90D', phaenon: '#B98CFF', lukxed: '#FF8A7A' };
// enemy: texture, hp, points, world height, telegraph s, attack (0 melee, 1 shot, 2 none), stop depth range, approach speed,
// then once active: sway width, sway frequency, height bob, advance speed toward the camera
const ET = {
  d: ['drone', 1, 100, .5, .9, 1, 2.2, 3.6, 1.1, .8, 1.7, .15, 0], t: ['trooper', 2, 150, 1.15, 1.1, 1, 2.6, 4.4, 1, .9, .9, 0, 0],
  v: ['vandal', 1, 120, 1.1, .75, 0, 3, 4.5, .7, .5, 4, 0, .6], p: ['purun', 6, 300, 1.4, 1.3, 0, 2.6, 3.4, .4, .08, 1.2, .05, .15],
  c: ['civ', 1, 0, 1.05, 0, 2, 2.6, 4, .3] };
// level: name, mission + countdown, script (M move s, W waves with | groups, B story beat, X boss)
const LV = [
  ['CENTRO DE CARACAS', R`Defiende la antena del Ávila
CUENTA REGRESIVA 90%`, 'M1 Wtv|dct|vdv M3 Bl1a M2 Wrr|qrd|rvr M3 Wtrt|drd M3 X Bl1b'],
  ['METRO DE CARACAS', R`Escolta a los civiles por el túnel
CUENTA REGRESIVA 96%`, 'M2 Wtc|vpt|cvt M3 Bl2a M2 Wxr|qcx|pvp M4 Wdcd|xrx M3 X Bl2b'],
  ['RORAIMA', R`Responde al llamado de Fornax
5.143333°  -60.762500°`, 'M3 Wxtx|cxd|vxv M3 Bl3a M2 Wpxt|xvx|dpd M3 X Bl3b']];

let AG, ia = 1;
let spd = 0, rt = 0, cz = 0, cx, hy, lr, q, glt = 0, odT, hs, hf, WL, UL, pix, gg, fg, hg, dG, em, si, steps, sT, mv;
let snT, suT, wq, wg, wi, wt, gT, nE, poi = 0, wT = 0, MS = [], FX = [], WA, WX;
let sp, tBar, tB, tPress, TI, SW, sD, dPor, dN, dT, dC = [], bossT, ov, oT, eH, nL;
const E = [], PO = [], PR = [], MG = new Set;

// ---- more small helpers
const ring = (w, c, a, x, y, r) => G.lineStyle(w, c, a).strokeCircle(x, y, r);
const line = (w, c, a, x, y, x2, y2) => G.lineStyle(w, c, a).lineBetween(x, y, x2, y2);
const arc = (w, x, y, r, f, c = 0xff2a55) => G.lineStyle(w, c).beginPath().arc(x, y, r, -1.57, 6.28 * f - 1.57).strokePath();
const sr = (w, c, x, y, W, H, a) => G.lineStyle(w, c, a).strokeRect(x, y, W, H);
const box = (c, x, y, w, h) => G.fillStyle(0x0d0620, .9).fillRoundedRect(x, y, w, h, 12).lineStyle(3, c).strokeRoundedRect(x, y, w, h, 12);
const u = o => (UL.add(o), o);
// texture choice in one place: SEÑAL <= 1 shows raw low-res; else the CNN (IA ON) or plain bicubic (IA OFF)
const tk = k => !lr && T.exists(k + '_hd') ? k + (ia ? '_hd' : '_bc') : T.exists(k) ? k : 'p';
const retex = () => MG.forEach(o => o.setTexture(tk(o.k)) && o.dw && o.setDisplaySize(o.dw, o.dh));
const arr = v => Array.isArray(v) ? v : [];
const hsh = n => abs(sin(n * 78.23 + lvl * 3.7) * 43758.5) % 1;
const beat = id => sto('beat', null, run, id);
const cyc = (k, a, b, v, n) => (hit(k[a]) && (v = (v + n - 1) % n, au('beep')), hit(k[b]) && (v = (v + 1) % n, au('beep')), v);
const flash = d => cam.flash(d, 248, 194, 11);
// buttons of each player who has not confirmed yet
const each = f => P.map(p => p.ok || f(p, p.K));
const tint = (s, f, c) => f ? s.setTintFill(0xffffff) : c ? s.setTint(c) : s.clearTint();
const foes = () => E.filter(e => e.on && !e.de && e.k != 'c');
const live = () => P.filter(p => p.on && p.hp > 0);
const ok = t => t && t.hp > 0 && !t.de;
const banner = (a, b, c) => { pop(400, 150, a, c, 36, 3000); pop(400, 205, b, WH, 20, 3000); };
// one shared overlay text for continue / name entry / ending
const ovSet = (z, c, y, s = '') => ov.setFontSize(z).setColor(c).setY(y).setText(s);
// portrait widget: raw low-res image under an HD copy revealed by a scanning crop
const mkPor = (x, y, wd) => { const o = { p: 1, t: 0 }; for (const k of 'lh') o[k] = OA(u(pos(img().setOrigin(0), x, y)), { dw: wd, dh: wd * 1.2 }); return o; };
const porSet = (o, k) => {
  o.p = o.t = 0;
  [o.l.setTexture(k), stx(o.h, k)].map(i => i.setDisplaySize(i.dw, i.dh));
};
const porUp = (o, d) => { o.p = min(1, o.p + d); const f = o.h.frame; o.h.setCrop(0, 0, f.width, f.height * o.p); return o.l.y + o.l.dh * o.p; };
const porVis = (o, v) => vis([o.l, o.h], v);

// ---- scenes: perspective quads in world space (x lateral, h height, z depth); far parts fade into the dark
const Q = (c, a, ...v) => { G.fillStyle(c, a).beginPath(); for (let i = 0; i < 12; i += 3) G.lineTo(PX(v[i], v[i + 2]), PY(v[i + 1], v[i + 2])); G.fillPath(); };
const hq = (c, a, x0, x1, h, z0, z1) => Q(c, a, x0, h, z0, x1, h, z0, x1, h, z1, x0, h, z1);
const fq = (c, x0, x1, h = 0) => hq(c, 1, x0, x1, h, .4, 40);
const scene = () => {
  const l = lvl, m = l == 2;
  G = gg.clear();
  // ground: avenue + sidewalks / metro platform, track pit and ceiling / dark fog under the Roraima backdrop
  if (l < 2) fq(0x48424f, -2.6, 2.6), fq(0x24212b, -1.7, 1.7);
  else if (m) fq(0x6e6c74, -2.2, 1.3), fq(0x101014, 1.3, 4, -.5), fq(0x1c1a22, -2.2, 4, 2.8);
  else {
    // Roraima: the tepuy's flat top and sheer walls on the horizon, a thin waterfall and low clouds
    Q(0x141c26, .9, -14, 1, 30, 8, 1, 30, 7, 9.5, 30, -13, 9.5, 30);
    line(2, 0xcfe8ff, .6, PX(2, 30), PY(9.5, 30), PX(2, 30), PY(1, 30));
    rp(2, i => G.fillStyle(0xffffff, .12).fillEllipse(PX(i * 12 - 9, 30), PY(i + .5, 30), 330, 26));
    rp(12, i => rect(0x08060c, i * .07, 0, 380 + i * 20, 800, 20));
  }
  for (let j = 13; j >= 0; j--) {
    const n = (cz / 3 | 0) + j, Z = n * 3 - cz, z0 = max(.4, Z), z1 = Z + 3, a = cl(1.7 - z0 / 15, 0, 1), sl = n % 2 * 2 - 1, X = sl * 1.85;
    if (z1 < .5) continue;
    WA = a;
    // lane dash and a street lamp (alternating curbs) with its power line / a ceiling light
    if (l < 2) {
      hq(0xd8d0b0, a, -.05, .05, 0, z0, max(z0, Z + 1));
      if (Z > .4) {
        const x = PX(X, Z), y = PY(2.7, Z);
        line(max(1, 18 / Z), 0x4a4658, a, x, PY(0, Z), x, y).lineStyle(1, 0).lineBetween(x, y, PX(X, Z + 6), PY(2.7, Z + 6));
        circ(0xffd27a, a * .3, x, y, 70 / Z); circ(0xffffff, a, x, y, 7 / Z + 1);
      }
    } else m && hq(0xf0f0ff, a, -.4, .4, 2.78, z0, max(z0, Z + .6));
    for (let s = -1; s < 2; s += 2) {
      const r = hsh(n * 2 + s), X = WX = m && n < 7 && s > 0 ? 1.5 : s * (m ? 2.2 : 2.6);
      if (l < 2) {
        // facades: lit windows, shop shutters and signs
        const h = 2.4 + r * 3.6;
        wall([0x2e2a3c, 0x3b2f33, 0x283a40, 0x40392e][r * 4 | 0], z0, z1, 0, h);
        wall(0x57535f, z0, z1 - .3, 0, .85);
        wall([0xff4fd8, 0x50f2c4, 0xf2e205, 0xff6a3d][n % 4], Z + .6, Z + 2.2, .95, 1.25);
        for (let f = 1.6; f < h - .5; f++) rp(2, c => wall(hsh(n * 9 + f * 3 + c + s) < .35 ? 0xffd27a : 0x15131e, Z + .6 + c * 1.4, Z + 1.3 + c * 1.4, f, f + .6));
      } else if (m && n < 7)
        // metro: tiled wall with the orange signage strip / the stopped train with lit windows
        s < 0 ? (wall(0xcfc7b8, z0, z1, 0, 2.8), wall(0xf08a24, z0, z1, 1.7, 2.1)) : (wall(0x9aa4b4, z0, z1, -.4, 1.6), wall(0xfff0c0, Z + .5, Z + 2.5, .7, 1.3));
      // tunnel: dark walls with passing lights
      else if (m) wall(0x1c1a20, z0, z1, -.5, 2.8), Z > .5 && circ(0xffe0a0, a, PX(X * .95, Z), PY(1.8, Z), 40 / Z);
      // roraima: rock ledges
      else wall(0x4d5a3e, z0, z1, 0, .5 + r * .7);
    }
  }
  // cars and motorbikes parked along the curbs or crashed: depth-sorted sprites enemies use as cover
  rp(8, j => {
    const n = (cz / 4 | 0) + j, o = PR[n % 8], z = n * 4 + hsh(n) * 2 - cz, mo = hsh(n + 3) < .3, cr = hsh(n + 7) < .3, s = o.s, k = mo ? 'moto' : 'car';
    s.visible = o.on = l < 2 && z > .6 && T.exists(k); o.x = (hsh(n + 9) < .5 ? -1 : 1) * (cr ? .5 : mo ? 1.45 : 1.15); o.z = z;
    o.on && pos(stx(s, k).setTint([0xd04040, 0x4060d0, 0xe0e0e0, 0x555560, 0xe0b030][n % 5]), PX(o.x, z), PY(0, z), (mo ? 280 : 700) / z / s.frame.width, 40 - z);
  });
};

// ---- enemies and enemy shots
const spawn = k => {
  const e = E.find(e => !e.on), sd = rand() < .5 ? -1 : 1, c = k == 'x' && M.ally != 'vidnah', cv = pick(PR.filter(o => o.on && o.z > 2 && o.z < 5.5)), r = rand();
  k = { x: 't', r: M.m ? 'v' : 't', q: M.m ? 'd' : 'c' }[k] || k;
  const d = ET[k], z = rnd(d[6], d[7]), gr = k == 't' || k == 'v';
  if (!e) return;
  stx(e.s, d[0]).visible = 1;
  OA(e, { b: tm, on: 1, k, d, hp: d[1] + (lvl > 2 && k == 't'), st: 0, cl: c, r: rnd(0, 6), t: rnd(1.5, 3), de: 0, fl: 0,
    x: sd * 2.3, z, h: k == 'd' ? 3 : 0, x1: k == 'c' ? -sd * 3.5 : rnd(-1, 1), z1: z, h1: k == 'd' ? rnd(.45, 1) : 0 });
  // pop-out origins (House of the Dead): out of a doorway, off a rooftop, from behind a car, out of the train, or from the depth
  if (k == 'p') e.x = rnd(-1, 1), e.z = 9;
  else if (gr && lvl == 2) e.x = 1.5, e.x1 = rnd(-1.6, .8);
  else if (gr && cv && r < .5) e.x = cv.x, e.z = e.z1 = cv.z + .3, e.x1 = cv.x * .2;
  else if (gr && r < .75) e.h = 3;
  return e;
};
const shot = (x, h, z, c) => { const b = B.find(b => !b.on); b && (OA(b, { on: 1, x, h, z, v: (z - .7) / 1.6 * AG }).s.setTint(c).visible = 1); };
const eUp = (e, dt) => {
  if (e.de) return (e.de -= dt) <= 0 && off(e);
  const d = e.d, f = min(1, dt * (e.st ? 3 : d[8] * 2)), a = tm * d[10] + e.r;
  // approach the stop point; once active: drones fly a figure-8 and dive to attack, raiders zig-zag in,
  // guardians stomp forward, troopers strafe and duck behind cover (melee enemies step back in after a hit)
  e.x += (e.x1 + (e.st && sin(a) * d[9]) - e.x) * f;
  e.z += (e.z1 * (e.k == 'd' && e.st > 1 ? .6 : 1) - e.z) * f;
  e.h += (e.h1 + (e.st && d[11] * (1 + sin(a * 2))) - e.h) * f;
  if (!e.st) {
    if (abs(e.x - e.x1) + abs(e.z - e.z1) + abs(e.h - e.h1) > .15) return;
    return e.k != 'c' ? e.st = 1 : off(e);
  }
  e.z1 = max(1.4, e.z1 - d[12] * dt);
  // troopers strafe (sway) and duck behind cover between attacks, unhittable
  e.dk = e.k == 't' && e.st < 2 && sin(tm * 1.3 + e.r) > .6;
  // melee attackers only telegraph once they are close
  if (e.st < 2) e.dk || (e.t -= dt * AG) <= 0 && (d[5] || e.z < 2.4) && (e.st = 2, e.tt = d[4], au('beep'));
  else if ((e.tt -= dt) <= 0) {
    e.st = 1; e.t = rnd(1.8, 3.4);
    d[5] ? shot(e.x, e.h + d[3] * .5, e.z - .2, e.k == 'd' ? 0x50f2c4 : 0xff3d6e) : (hurt(), e.z += .7);
  }
};
const eDraw = (e, dt) => {
  const s = e.s, d = e.d, h = e.H = d[3] * 330 / e.z, x = e.X = PX(e.x, e.z), y = e.Y = PY(e.h, e.z);
  const c = h / s.frame.height, w = e.W = pos(s, x, y, c, 40 - e.z, c * (e.dk ? .55 : 1)).displayWidth;
  e.C = y - h / 2;
  gg.fillStyle(0, .4).fillEllipse(x, PY(0, e.z), w * .9, h * .1 + 2);
  tint(s, e.de > 0 || (e.fl -= dt) > 0, e.st > 1 && tm * 9 % 2 < 1 && 0xff4060);
  s.setAlpha(e.de > 0 ? e.de * 4.5 : e.cl && e.st < 2 ? .13 + .08 * sin(tm * 30) : 1);
  // telegraph: red countdown arc; civilian "don't shoot" marker
  e.st > 1 && !e.de && arc(6, x, e.C, max(w, h) * .55 + 6, e.tt / d[4]);
  e.k == 'c' && ring(4, 0x50f2c4, 1, x, y - h - 14, 7);
  e.k == 'p' && circ(0xf8c20b, .45 + .3 * sin(tm * 9), e.ex = x - w * .2, e.ey = y - h * .8, h * .06 + 3);
};

// ---- bosses: texture, start y, name, weak points [x, y offsets in sprite sizes, hp, radius px]; tt = telegraph timer
const BT = [['ship', -120, 'NAVE DE LOS PRIMEROS', [[-.27, .3, 9, 30], [0, .38, 9, 30], [.27, .3, 9, 30]]], ['purun', 700, R`GUARDIÁN ANCESTRAL`, [[-.2, -.8, 28, 36]]], ['boss', 470, 'PHELIOS', [[.1, -.58, 36, 100]]]];
const bossStart = () => {
  const b = BS, k = lvl, [tx, y, nm, w] = BT[k - 1];
  OA(b, { on: 1, k, de: 0, fl: 0, t: 2.5, sh: 0, ci: 0, x: 400, y, v: k > 2 && M.boss == 'phaenon', tx });
  b.mx = 0; b.w = w.map(([x, y, hp, r]) => (b.mx += hp, { x, y, hp, r }));
  stx(b.s, b.tx).setOrigin(.5, k < 2 ? .5 : 1).setAlpha(1).visible = 1;
  bossT.setText(b.v ? 'PHAENON' : nm);
  banner(R`¡ALERTA!`, bossT.text, PH[1]); au('boss'); mus(4);
  k < 2 && (bgSh.visible = 0);
};
const bossChk = () => {
  const b = BS;
  if (!b.de && b.w.every(w => w.hp <= 0)) {
    b.de = 2.2; hs = .2; au('kill'); cam.shake(700, .02); mus(lvl);
    live().map(p => p.sc += 3000);
    banner(R`¡JEFE DERROTADO!`, '+3000', YEL);
  }
};
// boss hit test around (x, y) with radius r: n damage, weak points take x wm
const bossHit = (p, x, y, r, n, wm) => {
  const b = BS, top = b.y - b.H * b.s.originY;
  if (abs(x - b.x) > b.W * .45 + r || y < top - r || y > top + b.H + r) return;
  for (const w of b.w) if (w.hp > 0 && hypot(x - w.X, y - w.C) < w.r + r) {
    if (b.k > 2 && (b.v ? b.sh : b.ci < 3)) return tm > wT && (wT = tm + 1.5, pop(x, y - 30, b.sh ? R`¡ESCUDO!` : R`¡SOLO EN VERDE!`, '#B98CFF')), 1;
    w.hp -= n * wm; b.fl = .05; boom(6, x, y); au('hit'); combo(p); p.sc += 30 * p.mu;
    w.hp > 0 || boom(40, x, y);
    return bossChk(), 1;
  }
  return boom(2, x, y), 1;
};
const bossUp = dt => {
  const b = BS, k = b.k;
  if (b.de) {
    rand() < .35 && boom(14, b.x + rnd(-.4, .4) * b.W, b.y - (k < 2 ? rnd(-.4, .4) : rnd(.1, .9)) * b.H) && cam.shake(80, .01);
    b.s.setAlpha(b.de / 2.2);
    return (b.de -= dt) <= 0 && (off(b), nextStep());
  }
  b.t -= dt * AG;
  if (k < 3) b.x = 400 + sin(tm * .6) * 180, b.y += ((k < 2 ? 150 : 600) + sin(tm * 1.3) * 20 - b.y) * dt * 1.5;
  // Phelios: skin colour = combat mode, vulnerable only in green; Phaenon: shield phases
  else b.x = 400 + sin(tm * .8) * 210, b.v ? b.sh = tm % 7 < 4 : b.ci = (tm / 1.3 | 0) % 4;
  // telegraph a weak point, then it fires
  if (b.t <= 0) {
    const w = pick(b.w.filter(w => w.hp > 0));
    b.t = k < 2 ? 1.8 : 1.6;
    w && (w.tt = .9);
  }
  b.w.map(w => w.tt > 0 && (w.tt -= dt) <= 0 && w.hp > 0 && shot((w.X - 400) / 175 + cx, 1 - (w.C - hy) / 103, 3.2, b.v ? 0x73d90d : 0xff3d6e));
};
const bossDraw = dt => {
  const b = BS, s = b.s, k = b.k;
  pos(s, b.x, b.y, k < 2 ? 470 / s.frame.width : (k < 3 ? 440 : 330) / s.frame.height, 9);
  b.W = s.displayWidth; b.H = s.displayHeight;
  tint(s, b.de > 0 || (b.fl -= dt) > 0, k > 2 && (b.v ? 0xe8e4ff : [0xff4fd8, 0x50f2c4, 0xf2e205, 0x73d90d][b.ci]));
  for (const w of b.w) {
    w.X = b.x + w.x * b.W; w.C = b.y + w.y * b.H;
    if (w.hp > 0 && !b.de) k < 3 && circ(k < 2 ? 0xff4fd8 : 0xf8c20b, .5 + .3 * sin(tm * 10), w.X, w.C, w.r * .8), w.tt > 0 && arc(6, w.X, w.C, 44, w.tt / .9);
  }
  b.sh && ring(6, 0xb98cff, .9, b.x, b.y - b.H / 2, b.H * .62);
};

// ---- players and weapons
const addSc = (p, v, x, y, c = p.H) => { p.sc += v *= p.mu; pop(x, y, '+' + (v | 0), c); };
const combo = p => { const m = min(8, 1 + (++p.ch / 6 | 0)); m > p.mu && pop(p.x, p.y - 50, 'COMBO x' + (p.mu = m), YEL, 36); };
// a hit lands on a random living player (or on player i when given)
const hurt = i => {
  const p = i == null ? pick(live()) : P[i];
  if (!p || p.hp <= 0 || p.inv > 0 && i == null) return;
  p.hp--; p.inv = 1.2; p.ch = 0; p.mu = 1; glt = .5;
  cam.shake(260, .016); hf = 1; au('hurt');
  pop(p.u, 505, R`-1 SEÑAL`, RED, 26);
  live().length || (mode(CONT, 10), mus(null), au('lose'), ovSet(46, YEL, 290));
};
// join / continue (HotD style: score resets, the record is kept)
// a continue gives back one Overdrive charge only if none is left, and then it starts cooling down
const reset = p => OA(p, { on: 1, pl: 1, hp: p.mx, sc: 0, am: HE[p.h][8], bc: p.bo ? p.bc : 25, bo: max(p.bo | 0, 1), ch: 0, mu: 1, inv: 2, rl: 0, lk: 0, hx: 0, lq: 0 });
const revive = p => { p.pl || (p.h = (P[1 - p.i].h + 1) % 3); p.bs = fsc(p); reset(p); au('start'); pop(p.u, 470, p.n + R` ¡A LA CARGA!`, p.H, 26); };
// damage around (x, y): r hit radius, n damage (0 = Sumer: 1 near, .5 far), all = pierce/area hits every target
const strike = (p, x, y, r, n, all) => {
  let k = 0;
  for (const b of B) if (b.on && hypot(b.X - x, b.Y - y) < b.r * .6 + r + 12) { off(b); boom(10, b.X, b.Y); addSc(p, 50, b.X, b.Y); k = 1; if (!all) return; }
  for (const t of E.filter(e => e.on && !e.de && !e.dk && abs(x - e.X) < e.W * .42 + r && y < e.Y + r && y > e.Y - e.H - r).sort((a, b) => a.z - b.z)) {
    k = 1;
    if (t.k == 'c') t.de = .3, au('civ'), pop(t.X, t.Y - t.H, R`¡CIVIL! -1 SEÑAL`, RED), hurt(p.i);
    else {
      t.fl = .07; boom(5, t.X, t.C); combo(p);
      (t.hp -= (n || (t.z < 2.6 ? 1 : .5)) * (t.k == 'p' && hypot(x - t.ex, y - t.ey) < t.H * .12 + 8 + r ? 3 : 1)) > 0 ? au('hit') : kill(t, p);
    }
    if (!all) return;
  }
  BS.on && !BS.de && bossHit(p, x, y, r, n || .5, p.h > 1 ? 2 : 1) || k || (p.ch = 0, p.mu = 1, boom(2, x, y));
};
// KEEPER X9 launches a tracking missile, SIC KLE-A fires a fast burst, RAILGUN SR pierces with a beam from below
const fire = p => {
  const x = p.x, y = p.y, sx = p.i ? 560 : 240, h = p.h, g = h > 1, rl = (s = RL) => pop(x, y - 40, s, RED);
  p.cd = HE[h][7];
  if (p.rl > 0) return;
  if (!p.am) return au('empty'), tm > (p.rq | 0) && (p.rq = tm + 1, rl());
  --p.am || rl();
  p.rk = p.fa = 1; au(g ? 'hit' : 'shot');
  // SIC KLE-A heats up: sustained fire overheats it and locks it for 1.2 s
  h == 1 && (p.hx += .1) >= 1 && (p.cd = 1.2, rl(R`¡SOBRECALENTADA!`), au("empty"));
  if (!h) return MS.push({ p, x, y, l: p.lk, t: 0, sx });
  g && fx(0xc8f4ff, sx, 600, x, y);
  strike(p, x, y, g ? 8 : 3, g * 3, g);
};
// Qawakun Overdrive: 2 per run, the second at -75%
const bomb = p => {
  if (!p.bo || p.bc > 0) return au('empty');
  const f = p.bo-- > 1;
  p.bc = 25;
  odT = f ? 6 : 1.5; au('bomb'); cam.shake(500, .02); flash(300); fx(0xf8c20b, 400, 300, 650);
  banner('QAWAKUN OVERDRIVE', f ? R`SEÑAL HD RESTAURADA` : 'POTENCIA -75%', GOLD);
  B.map(off);
  foes().map(e => (f || --e.hp <= 0) && kill(e, p));
  if (BS.on && !BS.de) { let n = BS.mx / (f ? 4 : 16) | 0; for (const w of BS.w) { const m = min(max(w.hp, 0), n); w.hp -= m; n -= m; } bossChk(); }
};
// lockable targets left to right: visible enemies and the boss's weak points
const tgs = () => [...foes().filter(e => e.st), ...BS.on && !BS.de ? BS.w.filter(w => w.hp > 0) : []].sort((a, b) => a.X - b.X);
const ctrl = (p, dt) => {
  const k = p.K, ix = btn(k[3]) - btn(k[2]), iy = btn(k[1]) - btn(k[0]), H = HE[p.h];
  p.inv -= dt; p.cd -= dt; p.hx = max(0, p.hx - dt * .5);
  // the magazine refills when the reload ends; Overdrive announces when it is ready again
  p.rl > 0 && (p.rl -= dt) <= 0 && (p.am = H[8]);
  p.bc > 0 && (p.bc -= dt) <= 0 && p.bo && pop(p.u, 470, 'B3 LISTO', GOLD, 26);
  p.a = ix || iy ? min(1, p.a + dt * 2.5) : 0;
  const v = (260 + 540 * p.a) * dt * (ix && iy ? .71 : 1);
  p.x = cl(p.x + ix * v, 6, 794); p.y = cl(p.y + iy * v, 6, 594);
  // B4 lock: first press takes the nearest target, next presses cycle left to right; moving or a dead target releases it
  if (ix || iy || !ok(p.lk)) p.lk = 0;
  const d = t => hypot(t.X - p.x, t.C - p.y), L = hit(k[8]) && tm > p.lq && (p.lq = tm + .25, tgs());
  L && (p.lk = L.length && (p.lk ? L[(L.indexOf(p.lk) + 1) % L.length] : L.reduce((a, b) => d(a) < d(b) ? a : b))) && au('beep');
  // otherwise a light aim assist pulls toward the nearest enemy within ~46px
  let t = p.lk, bd = 46;
  if (!t) for (const e of foes()) e.st && d(e) < bd && (bd = d(e), t = e);
  if (t) { const f = min(1, dt * (p.lk ? 12 : p.a > .4 ? 1.5 : 6)); p.x += (t.X - p.x) * f; p.y += (t.C - p.y) * f; }
  (hit(k[4]) | btn(k[4])) && p.cd <= 0 && fire(p);
  hit(k[5]) && p.am < H[8] && p.rl <= 0 && (p.rl = H[9], au('reload'));
  hit(k[6]) && bomb(p);
};

// ---- flow
const upMods = () => {
  M = OA({}, sto('mods', {}, run, lvl));
  AG = M.hard = cl(+M.hard || 1, .6, 1.6); M.m = M.route == 'metro';
  const mx = M.extra ? 6 : 5;
  P.map(p => p.mx != mx && (p.hp > 0 && (p.hp = cl(p.hp + mx - p.mx, 1, mx)), p.mx = mx));
};
// START -> hero select (each player: joystick + B1; P2 cannot take P1's hero) -> intro -> level 1
const startGame = n => {
  mode(SEL, 20); nE = -1; vis(TI, 0); vis(SW, 1);
  P.map(p => (p.on = p.i < n, p.ok = !p.on));
};
const selUp = () => {
  each((p, k) => (p.h = cyc(k, 2, 3, p.h, 3), (hit(k[4]) || mt < 0) && (P.some(o => o != p && o.on && o.ok && o.h == p.h) ? mt < 0 ? p.h = (p.h + 1) % 3 : au('empty') : (p.ok = 1, au('reload')))));
  // cursors: P1 / P2 frames around the hovered hero, thicker once confirmed
  G = hg;
  for (const p of P) { const o = p.i * 6; p.on && sr(p.ok ? 8 : 4, p.C, 70 + p.h * 260 + o, 86 + o, 140 - o * 2, 168 - o * 2); }
  const J = P.filter(p => p.on);
  sD.setText(J.map(p => R`${p.n} ${up(HE[p.h][0])}${p.ok ? ' ✔' : ''} · ${HE[p.h][3]}`).join('\n'));
  const n = P[1].on + 1;
  if (P.every(p => p.ok)) {
    vis(SW, 0);
    run = sto('newRun', {}, world, n, J.map(p => HE[p.h][0]));
    P.map(p => (p.bo = 2, p.bc = 0, p.mx = 5, p.bs = 0, reset(p), p.on = p.pl = p.ok = p.i < n, p.x = 300 + p.i * 200, p.y = 330));
    lvl = 1; au('start');
    dialog(beat('intro'), 'intro', () => startLevel(1));
  }
};
const setBg = () => {
  const b3 = lvl > 2 && T.exists('bg3');
  stx(bg, b3 ? 'bg3' : 'av').setOrigin(.5, b3 ? .5 : 1).setTint(b3 ? 0xa0a0b0 : 0xffffff);
  bg.visible = bgSh.visible = lvl != 2;
};
const startLevel = n => {
  const L = LV[n - 1];
  let a = M.ally;
  lvl = n; steps = L[2].split(' '); si = -1; cz = 0; upMods(); setBg();
  // mission card + first-seconds controls hint
  banner(R`MISIÓN ${n} · ${L[0]}`, L[1], PH[0]); mus(n); md = PLAY; snT = 6; suT = 4;
  n < 2 && pop(400, 505, R`B1 DISPARA · B2 RECARGA · B4 FIJA`, WH, 20, 5000);
  (a = a || M.sniper && 'lukxed') && pop(400, 300, up(a) + ' TE CUBRE', WC[a]);
  nextStep();
};
const nextStep = () => {
  const s = steps[++si];
  if (!s) return lvl < 3 ? startLevel(lvl + 1) : dialog(beat('end'), 'end', ending);
  const a = s.slice(1);
  stp = s[0]; sT = 0;
  if (stp == 'M') mv = +a;
  else if (stp == 'W') wq = a.split('|'), wg = wi = gT = 0, wt = .4;
  else if (stp == 'B') dialog(beat(a), a, nextStep);
  else bossStart();
};
const waveUp = dt => {
  const g = wq[wg];
  if (g) wi < g.length ? (wt -= dt) <= 0 && (spawn(g[wi++]), wt = .75) : (foes().length < 2 || (gT += dt) > 9) && (wg++, wi = gT = 0, wt = .4);
  else if (!foes().length) {
    // checkpoint: Vidnah (if she defected) restores +1 SEÑAL
    const v = M.ally == 'vidnah';
    live().map(p => (p.sc += 500, v && p.hp < p.mx && p.hp++));
    v && au('heal');
    pop(400, 200, v ? R`VIDNAH: +1 SEÑAL` : R`¡ZONA LIMPIA! +500`, TEAL, 30);
    nextStep();
  }
};
const playUp = dt => {
  P.map(p => hit(p.K[7]) && !(p.on && p.hp > 0) && revive(p));
  if (hs > 0) return hs -= dt;
  odT -= dt; sT += dt;
  live().map(p => ctrl(p, dt));
  stp == 'M' ? sT > mv && nextStep() : stp == 'W' ? waveUp(dt) : stp == 'X' && BS.on && bossUp(dt);
  E.map(e => e.on && eUp(e, dt));
  B.map(b => b.on && (b.z -= b.v * dt, b.x -= b.x * dt * .6, b.h += (.85 - b.h) * dt * 1.5, b.z < .7 && (off(b), hurt())));
  // Keeper missiles arc to the aimed point (or home on the locked target) and explode in an area
  MS = MS.filter(m => {
    const l = m.l, k = ok(l), x = k ? l.X : m.x, y = k ? l.C : m.y;
    if ((m.t += dt * 3.5) < 1) return m.X = m.sx + (x - m.sx) * m.t, m.Y = 600 + (y - 600) * m.t - sin(m.t * 3.14) * 90, 1;
    strike(m.p, x, y, 60, 2, 1); fx(0xffa040, x, y, 70); boom(30, x, y); au('kill');
  });
  if (md != PLAY) return;
  // allies: Lukxed snipes every ~6 s; Sumer burns whoever gets into attack range every ~4 s
  const n = foes().filter(e => e.st).sort((a, b) => a.z - b.z)[0];
  if (M.sniper && stp == 'W' && (snT -= dt) <= 0 && n) snT = 6, fx(0xff8a7a, -10, 90, n.X, n.C), kill(n, 0, 'lukxed');
  if (M.ally == 'sumer' && (suT -= dt) <= 0 && n && (n.st > 1 || n.z < 2.4) && n.z < 3.6) suT = 4, fx(0x50f2c4, n.X, n.C, 140), kill(n, 0, 'sumer');
};

// ---- dialogue: portrait (radio voices: red name, empty frame), typewriter, choices with per-player votes
const dlgOff = () => { DL = 0; vis([dN, dT, ...dC], 0); porVis(dPor, 0); };
const dialog = (d, id, cb, re) => {
  const ls = arr(d && d.lines).filter(l => l && l.text), ch = re ? [] : arr(d && d.choices).slice(0, 3);
  if (!(ls.length + ch.length)) return dlgOff(), md = PLAY, cb();
  DL = { ls, ch, id, cb, i: -1, n: 0, c: [0, 0], v: [-1, -1], t: 0 };
  mode(DLG, mt); vis([dN, dT], 1); nextLine();
};
const nextLine = () => {
  const D = DL, l = D.ls[++D.i];
  if (l) {
    const k = T.exists(l.who) && l.who;
    D.n = D.w = 0;
    dN.setText(up(l.name || '').slice(0, 14)).setColor(WC[k] || (k ? GOLD : RED));
    D.s = dT.setText('').getWrappedText('' + l.text).join('\n');
    porVis(dPor, !!k);
    k && k != D.k && porSet(dPor, k);
    D.k = k;
  } else if (D.ch.length && !D.vo) {
    D.vo = 1;
    dT.setText(D.s + '\n▲▼ + B1' + (P[1].on ? ': VOTEN' : ''));
    D.ch.map((c, j) => dC[j].setText(up(c)).visible = 1);
  } else dlgOff(), md = PLAY, D.cb();
};
const dlgUp = dt => {
  const D = DL, n = D.ch.length;
  if (!D.vo) {
    const n0 = D.n | 0, L = D.s.length;
    D.n = min(L, D.n + dt * (btn('P1_2') || btn('P2_2') ? 400 : 60));
    D.n < L || (D.w += dt);
    ah(4) | ah(5) ? D.n < L ? D.n = L : nextLine() : D.w > 7 && nextLine();
    return (D.n | 0) != n0 && dT.setText(D.s.slice(0, D.n | 0)) && (n0 % 3 || au('talk'));
  }
  D.t += dt;
  for (const p of P) if (p.on && D.v[p.i] < 0) {
    const k = p.K;
    D.c[p.i] = cyc(k, 0, 1, D.c[p.i], n);
    // a B1 double-tap on the last line must not lock a vote before the choices are seen
    (hit(k[4]) && D.t > .4 || D.t > 15) && (D.v[p.i] = D.c[p.i], au('reload'));
  }
  if (P.every(p => !p.on || D.v[p.i] >= 0)) {
    // both vote in 2P; on disagreement P1 wins and agree=false
    const [a, b] = D.v, ag = a < 0 || b < 0 || a == b;
    ag || pop(400, 150, 'VOTO DIVIDIDO: GANA P1', YEL, 26);
    const r = sto('choose', null, run, D.id, a < 0 ? b : a, ag);
    upMods(); vis(dC, 0);
    dialog(r, D.id, D.cb, 1);
  }
};
const dlgDraw = dt => {
  const D = DL, c = parseInt(dN.style.color.slice(1), 16), n = D.ch.length, y0 = 384 - n * 52;
  G = dG; box(c, 14, 398, 772, 194);
  sr(2, c, 26, 410, 140, 168);
  if (D.k) { const y = porUp(dPor, dt * 2.2); dPor.p < 1 && rect(0xf8c20b, 1, 24, y - 2, 144, 4); }
  D.vo && box(0xf8c20b, 130, y0, 540, n * 52 + 12) && rp(n, j => {
    const y = y0 + 32 + j * 52;
    dC[j].setY(y);
    // vote cursors: P1 ▶ on the left, P2 ◀ on the right; white once locked
    for (const p of P) if (p.on && D.c[p.i] == j) { const x = p.i ? 640 : 160; G.fillStyle(D.v[p.i] < 0 ? p.C : 0xffffff).fillTriangle(x, y - 12, x, y + 12, x + (p.i ? -18 : 18), y); }
  });
};

// ---- ending, names, leaderboard, title
const ending = () => {
  const e = sto('ending', {}, run);
  mode(END, 30); mus(null); au('win'); flash(900);
  oT.setText(up(e.title || 'FIN'));
  ovSet(21, WH, 340, arr(e.lines).join('\n\n'));
};
const names = () => {
  mode(NAMES, 30); ovSet(26, GOLD, 130);
  P.map(p => (p.ok = !p.pl, p.np = 0, p.nm = [0, 0, 0], nL[p.i].setX(P[0].pl && P[1].pl ? 220 + p.i * 360 : 400).visible = p.pl));
};
const nameUp = () => {
  const ab = c => String.fromCharCode(65 + c);
  each((p, k, c = p.nm) => (c[p.np] = cyc(k, 1, 0, c[p.np], 26), hit(k[4]) && (++p.np > 2 ? (p.ok = 1, au('win')) : au('reload'))));
  P.map(p => p.pl && nL[p.i].setText(`${p.n}  ${pad(fsc(p))}\n\n` + p.nm.map((c, j) => j == p.np && !p.ok ? `[${ab(c)}]` : ` ${ab(c)} `).join('') + (p.ok ? '\nOK' : '\n ')));
  ov.setText(R`INGRESA TU NOMBRE
▲▼ LETRA · B1 OK  ${ceil(mt)}`);
  if (mt > 0 && !P.every(p => p.ok)) return;
  // save: top-5 scores + world memory (STORY.commit once per run, best player's name)
  let b = 0;
  vis(nL, 0);
  for (const p of P) if (p.pl) { p.nn = p.nm.map(ab).join(''); p.sc = fsc(p); scores.push({ n: p.nn, s: p.sc }); if (!b || p.sc > b.sc) b = p; }
  scores = valid(scores);
  store.set('qn-scores', scores);
  nE = scores.findIndex(e => e.n == b.nn && e.s == b.sc);
  world = sto('commit', world, world, run, b.nn, b.sc);
  store.set('qn-world', world);
  toTitle();
};
const valid = v => arr(v).filter(e => e && /^\w+$/.test(e.n) && e.s >= 0)
  .map(e => ({ n: e.n.slice(0, 3), s: min(e.s, 9999999) | 0 })).sort((a, b) => b.s - a.s).slice(0, 5);
const toTitle = () => {
  mode(TITLE, 0); lr = odT = DL = 0; off(BS); vis(nL, 0);
  [...E, ...B].map(off);
  P.map(p => p.on = p.pl = 0);
  lvl = 1; setBg(); retex(); mus(0); vis(TI, 1); porSet(tP, 'fornax');
};
// boot splash: "PLATANUS HACK 26, CARACAS · presenta" between two Venezuelan flags (tricolour + arc of 8 stars);
// fades in and out over 3.4 s, START or B1 skips
const flag = (x, a) => {
  rp(3, i => rect([0xffcc00, 0x00247d, 0xcf142b][i], a, x - 24, 264 + i * 11, 48, 11));
  rp(8, i => circ(0xffffff, a, x + 10 * sin(i / 3.9 - .9), 289 - 7 * Math.cos(i / 3.9 - .9), 1.3));
};
const splUp = () => {
  const a = min(1, (3.4 - mt) * 2, mt * 2), w = sp[0].width / 2 + 44;
  G = hg; rect(0, 1, 0, 0, 800, 600); flag(400 - w, a); flag(400 + w, a);
  vis(sp, 1); sp.map(t => t.alpha = a);
  (mt < 0 || ah(4) | ah(7)) && (vis(sp, 0), toTitle());
};
const titleUp = dt => {
  const y = porUp(tP, dt * .5), n = tP.p * 10 | 0;
  tP.p < 1 || (tP.t += dt) < 2.5 || porSet(tP, 'fornax');
  tBar.setText(R`QAWAKUN RECONSTRUYENDO SEÑAL
` + '▓'.repeat(n) + '░'.repeat(10 - n) + R` ${n * 10}%
B6 · ` + iaT());
  tPress.setAlpha(tm % 1 < .65 ? 1 : .2);
  tB.setText('TOP 5\n\n' + [0, 1, 2, 3, 4].map(i => { const e = scores[i]; return (i == nE ? '► ' : '') + `${i + 1}. ${e ? e.n + '   ' + pad(e.s) : '---   -------'}`; }).join('\n'));
  G = hg; box(0xff4fd8, 466, 222, 298, 240);
  sr(3, 0x50f2c4, 66, 228, 188, 224);
  tP.p < 1 && rect(0xffffff, 1, 60, y - 1, 200, 3);
  hit(P[0].K[7]) ? startGame(1) : hit(P[1].K[7]) && startGame(2);
};

// ---- per-frame rendering: SEÑAL degradation, world, HUD
const draw = dt => {
  q = odT > 0 || md == TITLE ? 9 : min(9, ...live().map(p => p.hp));
  // SEÑAL <= 1: the world falls back to the raw low-res textures
  +(q < 2) != lr && (lr = +(q < 2), retex(), lr && au('glitch'));
  glt = max(0, glt - dt);
  if (pix) {
    // SEÑAL 3: slight pixelate, 2: strong + glitch; hits spike it
    const a = (q > 3 ? 0 : q > 2 ? 1 : 3) + glt * 10 | 0;
    pix.active = a > 0; pix.amount = a;
  }
  // backdrop: El Ávila closing the avenue, or the Roraima art with a slow push-in, pan and bob while walking
  const b3 = bg.originY < 1;
  pos(bg, 400 - cx * 30, b3 ? 300 + sin(rt * 6) * 3 : hy, b3 ? 800 / bg.frame.width * (1.1 + .04 * sin(rt * .2)) : 1);
  pos(bgSh, 400 + sin(tm * .08) * 160, 66 + sin(tm * .7) * 8, 300 / bgSh.frame.width);
  scene();
  // the mothership and its shield "against everything"
  const x = bgSh.x, y = bgSh.y, sh = sin(tm * 3);
  bgSh.visible && G.lineStyle(2, 0xb98cff, .35 + .25 * sh).strokeEllipse(x, y, 370 + 8 * sh, 150 + 4 * sh);
  G = fg.clear();
  E.map(e => e.on && eDraw(e, dt));
  for (const b of B) if (b.on) {
    const r = b.r = 75 / b.z;
    pos(b.s, b.X = PX(b.x, b.z), b.Y = PY(b.h, b.z), r / 8 * (1 + .2 * sin(tm * 40)), 41 - b.z);
    circ(0xffffff, .9, b.X, b.Y, r * .3);
  }
  BS.on && bossDraw(dt);
  MS.map(m => m.X && circ(0xfff0c0, 1, m.X, m.Y, 7));
  // beams, tracers, blasts and shockwaves
  FX = FX.filter(f => (f.t -= dt) > 0);
  for (const f of FX) { const a = f.t / .35; f.Y ? line(10 * a + 2, f.c, a, f.x, f.y, f.X, f.Y) : ring(14 * a + 2, f.c, a, f.x, f.y, f.X * (1.2 - a)); }
};
const hud = dt => {
  const on = md == PLAY || md == CONT;
  G = hg;
  // hit: a red edge frame for ~250 ms (a full-screen flash hid the action)
  hf > 0 && sr(60, 0xff2040, 0, 0, 800, 600, hf * .5);
  hf -= dt * 4;
  md > PLAY && md < SPL && rect(0x05020d, md == DLG ? .3 : .75, 0, 0, 800, 600);
  ov.visible = md > DLG && md < SEL; oT.visible = md == END; eH.visible = md == END && mt < 28 && tm % 1 < .6;
  md == CONT && ov.setText(R`¿CONTINUAR?
${max(0, ceil(mt) - 1)}
${PS}
RÉCORD ${pad(max(...P.map(fsc)))}`);
  for (const p of P) {
    const x0 = p.u - 161, c = p.C, al = p.on && p.hp > 0, H = HE[p.h], n = H[8], am = p.rl > 0 ? n * (1 - p.rl / H[9]) : p.am, x = p.x, y = p.y, r = 15 + p.rk * 8, t = p.lk;
    p.rk = max(0, p.rk - dt * 6); p.fa = max(0, p.fa - dt * 9);
    p.L.visible = md == PLAY && t;
    if (md == PLAY && al) {
      // crosshair with recoil + muzzle flash; a pulsing bracket on the locked target
      const a = p.inv > 0 && tm % .2 < .1 ? .3 : 1, s = 24 + 4 * sin(tm * 12);
      circ(0xffffff, p.fa * .8, x, y, 10 + p.fa * 30);
      ring(4, c, a, x, y, r); circ(c, a, x, y, 4);
      p.rl > 0 ? arc(5, x, y, r + 9, 1 - p.rl / H[9], 0xf2e205) : p.cd > .3 && arc(5, x, y, r + 9, 1 - p.cd / 1.2, 0xff3d5a);
      t && sr(3, c, t.X - s, t.C - s, s * 2, s * 2) && pos(p.L, t.X, t.C - s - 12);
    }
    p.T.setText(`${p.n} ${!al ? p.on ? R`SIN SEÑAL · START` : PS : pad(p.sc) + (p.mu > 1 ? ' x' + p.mu : '')}`).setAlpha(al || tm % 1 < .6 ? 1 : .3).visible = on;
    p.N.setText(up(H[0]) + ' · ' + H[1]).visible = on && p.on;
    if (!on) continue;
    box(c, x0, 528, 322, 66);
    // SEÑAL bars, ammo, Overdrive charges
    al && rp(18, j => {
      j < p.mx && rect(j < p.hp ? p.hp > 3 ? 0xd9f21b : p.hp > 1 ? 0xf2e205 : 0xff3d5a : 0x2a1f40, 1, x0 + 14 + j * 24, 573, 20, 14);
      j < n && rect(j < am ? lc(0xf2e205, 0xff3d5a, min(1, p.hx)) : 0x2a1f40, 1, x0 + 168 + j * 84 / n, 566, 84 / n - 2, 21);
      j < 2 && circ(j < p.bo ? 0xf8c20b : 0x2a1f40, p.bc > 0 ? .3 : 1, x0 + 274 + j * 22, 576, 8);
      !j && p.bc > 0 && p.bo && arc(3, x0 + 252 + p.bo * 22, 576, 11, 1 - p.bc / 25, 0xf8c20b);
    });
  }
  (bossT.visible = BS.on && !BS.de && on) && rect(0x0d0620, .85, 196, 36, 408, 20) && rect(0xff4fd8, 1, 200, 40, BS.w.reduce((a, w) => a + max(0, w.hp), 0) * 400 / BS.mx, 12);
  md == DLG && dlgDraw(dt);
};

// ---- Phaser scene
const preload = function () { S = this; for (const k in ASSETS) this.load.image(k, ASSETS[k]); };
const create = function () {
  T = S.textures;
  // per asset: LR stays pixel-sharp, _hd from the neural upscaler, _bc a smooth (bilinear) upscale for IA OFF; failures fall back to LR
  for (const k in ASSETS) if (T.exists(k)) {
    const t = T.get(k), s = t.getSourceImage();
    t.setFilter(1); T.addImage(k + '_bc', s);
    try { T.addCanvas(k + '_hd', nnUp(s)); } catch (e) { }
  }
  G = S.make.graphics({}, false);
  rp(8, r => circ(0xffffff, .16, 8, 8, 8 - r));
  G.generateTexture('p', 16, 16).clear();
  // night sky over El Ávila (twin peaks of La Silla) with its barrio lights
  rp(30, i => rect(lc(0x070420, 0x4a2266, (i / 29) ** 2), 1, 0, i * 8, 1000, 8));
  rp(90, () => rect(0xffffff, rand() * .8, rand() * 1000, rand() * 150, 2, 2));
  rp(4, j => {
    const p = [{ x: 0, y: 240 }];
    for (let x = 0, g = (c, w) => exp(-(((x - c) / w) ** 2)); x <= 1000; x += 8) p.push({ x, y: 202 - 120 * g(480, 300) - 30 * g(410, 45) - 30 * g(560, 45) - 7 * sin(x / 37) + j * 22 });
    p.push({ x: 1000, y: 240 });
    G.fillStyle(lc(0x2a8a74, 0x0c2a2a, j / 3)).fillPoints(p);
    j || G.lineStyle(3, 0x50f2c4).strokePoints(p);
  });
  rp(260, () => rect(0xffd27a, rand(), rand() * 1000, 238 - rand() * rand() * 60, 2, 2));
  G.generateTexture('av', 1000, 240).destroy();
  cam = S.cameras.main;
  WL = S.add.layer(); UL = S.add.layer();
  // two cameras: world (postFX: pixelate/glitch/vignette) and a clean UI camera
  cam.ignore(UL); S.cameras.add().ignore(WL);
  // renderer type 2 = Phaser.WEBGL
  if (S.renderer.type == 2) { const fx = cam.postFX; pix = fx.addPixelate(0); fx.addVignette(.5, .5, .95, .3); }
  bg = w(img()); bgSh = stx(w(img()), 'ship').setTint(0xa898e0);
  gg = w(S.add.graphics());
  BS.s = w(img());
  rp(48, i => (i < 24 ? E : i < 40 ? B : PR).push({ s: w(i < 24 || i > 39 ? img().setOrigin(.5, 1) : img().setBlendMode(1)) }));
  fg = w(S.add.graphics().setDepth(50));
  em = w(S.add.particles(0, 0, 'p', { speed: { min: 60, max: 420 }, lifespan: 450, scale: { start: 1, end: 0 }, blendMode: 1, tint: [0xffffff, 0xf2e205, 0x50f2c4, 0xff4fd8], emitting: 0 }).setDepth(60));
  hg = u(S.add.graphics());
  // title
  tP = mkPor(70, 232, 180);
  tBar = tx(160, 484, 13, TEAL);
  tB = tx(615, 342, 18);
  tPress = tx(400, 530, 38, PH[0], PS);
  TI = [tP.l, tP.h, tBar, tB, tPress, tx(400, 80, 92, PH[0], 'ARRIVALS').setShadow(0, 0, PH[1], 22, 1, 1), tx(400, 152, 46, GOLD, R`LA INVASIÓN`).setShadow(0, 0, GOLD, 14, 0, 1),
    tx(400, 578, 14, WH, R`START1 · 1 JUGADOR  START2 · 2 JUGADORES`)];
  // hero select: portraits, names, weapons, stat labels, per-player style line and the controls legend
  SW = [tx(400, 36, 34, GOLD, R`ELIGE TU HÉROE`), sD = tx(400, 452, 15, WH),
    tx(400, 545, 14, TEAL, R`B1 DISPARAR · B2 RECARGAR · B3 QAWAKUN OVERDRIVE
B4 FIJAR OBJETIVO · B6 IA GRÁFICA ON/OFF · JOYSTICK APUNTAR`)];
  HE.map((h, j) => {
    // display size applied by retex() (title)
    const x = 140 + j * 260, o = OA(pos(stx(u(img()), h[0]), x, 170), { dw: 120, dh: 144 });
    SW.push(o, tx(x, 330, 15, WC[h[0]], R`${up(h[0])}
${h[1]} · ${h[2]}
` + [R`DAÑO`, 'CADENCIA', 'ALCANCE'].map((s, i) => '■■■■■□□□□□'.substr(5 - h[4 + i], 5) + ' ' + s).join('\n')));
  });
  // HUD
  P.map(p => (p.T = tx(p.u - 147, 548, 24, p.H, '', 0), p.N = tx(p.u - 147, 516, 13, p.H, '', 0), p.L = tx(0, 0, 12, p.H, 'FIJADO')));
  bossT = tx(400, 22, 18, PH[1]);
  // dialogue
  dG = u(S.add.graphics());
  dPor = mkPor(28, 412, 136);
  dN = tx(182, 424, 22, WH, '', 0);
  dT = tx(182, 446, 20, WH, '', 0, 0).setAlign('left').setLineSpacing(5).setWordWrapWidth(574);
  rp(3, () => dC.push(tx(400, 0, 22)));
  // overlays
  ov = tx(400, 300, 20).setWordWrapWidth(700);
  oT = tx(400, 120, 50, GOLD).setWordWrapWidth(760);
  eH = tx(400, 565, 20, YEL, '▶ B1 CONTINUAR');
  nL = P.map(p => tx(0, 300, 44, p.H));
  rp(16, () => PO.push(tx(0, 0, 22).setAlpha(0)));
  dlgOff(); vis(SW, 0);
  safe(() => AU.init(S.sound.context));
  store.get('qn-scores').then(r => scores = valid(r && r.value));
  store.get('qn-world').then(r => r && r.found && (world = r.value));
  sp = [tx(400, 281, 26, WH, R`PLATANUS HACK 26, CARACAS`), tx(400, 334, 22, WH, 'presenta')];
  toTitle(); vis(TI, 0); mode(SPL, 3.4);
};
const update = function (t, d) {
  const dt = min(d, 50) / 1000, v = md == PLAY ? (stp == 'M') * 1.8 : md == DLG ? spd : 1;
  tm += dt; mt -= dt;
  // rail motion: the camera walks the street (cz), with lateral sway and a walking bob; it holds still during waves
  spd += (v - spd) * min(1, dt * 1.5);
  rt += spd * dt; cz += spd * dt;
  cx = sin(rt * .35) * .35; hy = HY + sin(rt * 6) * 1.5 * min(spd, 1);
  hg.clear(); dG.clear();
  // B6 (either player): neural upscaler ON/OFF at any time
  ah(9) && (ia ^= 1, retex(), pop(400, 300, iaT(), GOLD, 30));
  md == SPL ? splUp() : md == TITLE ? titleUp(dt) : md == SEL ? selUp() : md == PLAY ? playUp(dt) : md == DLG ? dlgUp(dt) : md == NAMES ? nameUp() : md == END ? ((ah(4) | ah(5)) && mt < 28 || mt < 0) && names()
    : md == CONT && (P.map(p => hit(p.K[7]) && (revive(p), md = PLAY, mus(BS.on ? 4 : lvl))), mt < 0 && md == CONT && (banner('GAME OVER', '', PH[1]), names()));
  draw(dt);
  hud(dt);
};
// type 0 = Phaser.AUTO (WebGL, canvas fallback); scale mode 3 = FIT, autoCenter 1 = CENTER_BOTH
new Phaser.Game({ type: 0, width: 800, height: 600, parent: 'game-root', scale: { mode: 3, autoCenter: 1 }, scene: { preload, create, update } });
}

})();
