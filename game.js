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
// Every PNG starts with the same 18 bytes and ends with the same IEND chunk (lengths kept multiples of 3),
// so only the middle of each base64 string is stored; ASSETS gets the full data URIs.
const ASSETS = {};
for (const [k, v] of Object.entries({
  fornax: 'ACgAAAAwBAMAAACRVSWoAAAAFVBMVEUUDRvJn4/IPNiDamVkQToyISEAAAGIvYqpAAABxUlEQVR42mIgB6RhEQKUNQe5lYMwGID/agLrQekJ5gQvgs46FT9duyrOGqmF+x9hsJJXzVO9APnDP27yQ8cSwq09mn8P4Yd+hjUxP6rPsRxj9O1BV8HwQ3Xb/0v/bSz4ovZ4fOOT76RW6vEV7+bjWCZSVfAhd735iWQugnr7/tIvW1i3UNRpun8pUnsIzyx0kk/zr5B8tAAyQ/TCBI37EZY/LHByYv8N3XIKpKEC9vK0i76uKeTE/USSm4g3jM/b20SBYXLqP8JL1hAPd8cX5/C5yhjvqz9RyV0durQqfW/TFDYp6o428rbuuGNOEEhz+Xi9oUF1Itxznzi6egf0/cTFUA8n8PBLOfGXoe7dms7ScKFCCKgblYXeWXy1N8qA75wF27OsoujUWWZvo75AXSjqLcdK5tuoMUJc5NESd1oJpkW4GHM6GJmZ01snDXOMjEntmpUnJSKeZR2jFRlhp9IaO1KpOSYk22mSjeyb4sErEkOiXQmjwQasyUmNZAwAc7zaes5kmdRgWLTOvG0vFwHFzIrFXwSoGqhCvQfGhXmSDDi1rgEOwDSBOK1lHh46sSFSm5s9VaDeCWx2Rp3KHFTLqmH/B6Lyn6FEE5ey',
  sumer: 'ACgAAAAwCAMAAABUpcipAAAAFVBMVEUPFxxZKiiTUDjFeFvqpoj63MXAH7KsrriIAAABhklEQVR42mIYOADokw5SXM3BIAhGyu77H/i1VbMcMD+9D1Ki+AIA1Jbcv+E5MPj8ATt9FHfpq/kC4OTTucb7xfRc7Pi80r/WGz63PcDKcY/f8Q72MQBvAA7cDR/O0c4DLOyi85nuzNkAAni5Ldd58bnAy4fv4jbn4x1eZ1sL35Ch14FRfJb2tWNnORUDg6fiFiOwbecRxtik/CqgAQ7AALujMCbfEMBBiNAzVIziBA87skrDCdsThDoYTRC+nxZghG3a89MY3OvA5rvIYIbO68T+mGczuLt3GB6hwR1gC89w5qROXM9/hMv0OgcXAXgBBCxq3EVl32cGZCsu2tOOGiRmJDUxOgAAAlVy7/vpHgOQ0C6s2lcxpGD3yj+MDv+vpsNAGPz8AEnZDeuwgDuatMmrwsLPHYi59CpTk3ewxQ82AJ0sLUwHbtpw2OAcDHDHGwZNHTAMAI0OWytzEBhNgG3r2CgKgPV9fZ0nB1+y/naEXWf4o1VQgkNpADIQgBtUBRg0CIDtPzwY4a8K8GBN',
  phaenon: 'ACgAAAAwCAMAAABUpcipAAAAFVBMVEUTDh634u9u/ltvmqcwSlE5GWEAAAEWOp0FAAABeklEQVR42mIYBYDC6QC3VSCGoujz3If3v98S8hWPBXxC6ZWUVswRdjtKlZIy828GEUH5J+ew45OfZCYRjpnyYWzsEei3ZdNxhjP87EoARJAXuJwZgEvwBRmAiUBmwtRdNpYdWGYMsH6Tw3I1oSazdY0TxDX5XrphfUqZTe0HqFNp21fYZZNM5bzaO6g6LAeBMh0HxGo4jep8D3Wm8NylKQdjh0yuPFzs+YDQu5eqXxtR7TuG+3y6PO03XUMiMhspq7iDrkWUbWQwB6xjLYsUVV2umcKKLg5IVJmKo2SHNNTx4BRwgXLcBdQe/gSoJ99KJ4ZJh7Tp/5YFqR6/Nl7b9l6l9aWbyRyP0jDfqSWeItOEZQ89tm0avFXFY9R9Scs+mjR8saD/vmX8zOGwvUHfWZJ+Pph5z0SEuPlfqlqGBjDWbZNkGPev1Gfwuq4vvYc0Vim44nW/h/7OHz8kH6Mlu+FSAhrOuLqGFnCGppLb1T6h/jgXoYhw78j2D8dHKGY7uwhB',
  vidnah: 'ACgAAAAwBAMAAACRVSWoAAAAFVBMVEUKEwht9q+OvcYNzGM+jGAoXUYZOCEHC5d8AAABy0lEQVR42l3Qu67bMAwGYBaIuSvO6dwIyZlryM2ci3xmNRE1s2nE93+EUlKcS3/bEPCBNAVCS+c9w3vw5MbMbyJycs6Z/tfTpNpgjOnDC160zLiSh8rfh7mfM2Y3VBvMC55qnSl5ohua9a/tTq2S50WY0fS1f+QZKtb+cvGAPGPv1HYA8HsF/QOHvhh/MxbWq+egUQ8x1vLZhoZauNfjtjwq+s871kL4s/RWs21oxtriKUS7SVPDvq3cdgA5gTQcI2gwCwqgcMNdqMgRb96LNCSuGCKenPu64wQVidANZsb9A+Mw7BvOoRvmwQV+w3QN+TImeAvF712c+D/kLaA+LaEdks983M64uqNE/2Mxt7tRMiVGoSOjInJBzejdlMM5dIxSmmAwigknYgwM5/UygIAzvdMP2w6I1maPkA5a6laHHZToos8eAbpBSz/GXCekbK2icNeb8YuHvRoyyZkFRNBsEoDhggmJkBUXH+12+nYUABZOUUBKKDFcPxXjpQJjZYbjhgH9VDETUSQRtDZw5z0UOyz9up+IO0W5NYxm6U3vSTZHGzDf0VOm6NPVbhQlF8xtOJFVZBSOBXOqfz5aaz2DCBYk8RpbMhXkfy8EkjjZKjIg',
  qawakun: 'ACgAAAAwCAMAAABUpcipAAAAHlBMVEUbDiUuFFENST0piXRP88Wn73D0/vDZ8xsLBRf4wQyxNL8WAAABUElEQVR42qSUgYqGMAyDl6bT7f1f+ExgMh38Di541MOP5G91Lf8RsMFM+qZ6/8liKHqPH7YAuWolgcihmG5t+owV8FbmHE+DTIaEmAqTJjkMHRwSyanEMxy3IRmADRHkZGnxNmTAtBkEb0sa1OBsSJjKS2ZBW2qs5qBbmhPErDV9Y5KyAQzCUeIEkfoTbFIhuMGkLQ1W+hJow9HP6IQqmcdRacOqdFuqGOQwvOyO4+jRWgub5rCkQBuCECgSrZk0GKCfG/QIBbqNZpnkaCdTYCRDoqdXWivs5SJJ5v0oUGRoObmKOM+u4uywMl+gk/t5qtQX+IwWUbp/wDN6aUazsfhoZh3PTXIdzzzwSpNBPga+vkKKZeX6Cvc/igJ+f2bE9oe7fRQMfh8u7B/X/QVgYXelbC4pk5trb3+R7q/m7WU/ox9YXirXVa3i/6Tyt2EIAM4/D1Q/YY7O',
  phelios: 'ACgAAAAwCAMAAABUpcipAAAAFVBMVEUjDiimwO6oR7RVapBnJmc1QFkDAQN7rW7nAAABgElEQVR42o3TB5KFMAyDYTmyfP8j72oMhHjr/yrhm9AxqzPMNlMEHSVhy+kYZ5q0maIjf6OFuF3FKw5ZijsofpbFvWK4iPrOMXg6RqCm6xXThR4Hj7DHT1onFClJnHNS8DeeSGYmL7IhDCXdTnZb8ra9FQ7opGvbbOeCfKAdnEQbmlKO4Jba0MIbI28onRAdGbFhU76gRBUJsG9HtZvQgxEVAaT4T8i/YDdgd0AKAn6EPKBk2OQNReE7KE1YVQ/MbKhvIApXola6/B5iQ66WMCAPiFdkvqCd9APsKQG6rYaDWl6OeEEMKHLxCtAOZ4aPq+lqQwN1ODc8pFrWZxC53YApOnlkO0DTrZdk11BG8HbarbzlDZ8py6GhXaIlcLstIUANPykA03k7SM42kXFByG22fclwGS50kvmooHxgIrMhMCxAeSKzhk4FFDTKhi2vUIUqyWPbLYTjlSRRInXAzFzgfpDXIlcvRpDpZOegve/e/t6c0nvjsQuKOmC+oVn3AeVyE9RN7q+D',
  lukxed: 'ACgAAAAwBAMAAACRVSWoAAAAFVBMVEUQEBfRr5/TYuaDaVyTMrZvGo8/NDTapQxnAAABaElEQVR42q3SMW7bQBCF4RdsPLUWDHQAQemXfsb0cWjXKah+mEHe/Y8QMxS8lNTmLz/sYhaLwf+pkIwHGx/UyCBd2Jek18FL3CuZscfFAaMyEj0xAFhgabsxYUYHVI679xxhJOngDlsYRCKsjx4jXqZfwNfW0YQynU8/vp1+diyBp/ltfj1d5ujo9jRPl/n75a1jNvszT9N0nt87Wkgf+P7y6oGeTFK4cFuS4dlwlxAWe0jB0m8NSx1qrWM9oldWqu710M0qxw8m69BxabSx1lpqHgxb5oVK1sEGLK4rIpWBDFiAxbElpWL7riyMDY3pq6ajiG2zSFIOywHWns/bZRmrp8Rm5fB8ig2BHMhkxNJ+r2iSIgAlZWUI0xXF646MIZMA/Wus1YHFxRVDa4By5DhKLgn6rBzji2dGdKR0QGnZTDdYybZAHVFcI+DSDiXX8ohKkvQ7FKl+clc+Ip2SZJ9oktIlaal/AXp5ngNqB1BU',
  drone: 'ABgAAAAYCAMAAADXqc3KAAAAG1BMVEUKBRIRDBk0KkhNTl9ttCxwNneMe7fI/1r/T9izDIXbAAAAAXRSTlMAQObYZgAAAINJREFUeNqVygUWxDAAAtEM1O5/4l3qLlTC46c8BI4toevYtgU6NmWWWgOopmxAYjm3wnJsQQA6QtPH5mw/CIyjG1swrSizZA+fiCHJue62qiorEJuBqm3+gsQeKjiAA/8EWCBiObthA9hGttgCKGHKBJTCKiVbgJLMc0LG1JnmXr7nB7ZKAy0WQCU9',
  trooper: 'ACYAAAAwCAMAAABKbPgaAAAAG1BMVEUKBRIHBA4lNTUzgjFG0EZWZG5t/1qJm6HS5fDHwCIsAAAAAXRSTlMAQObYZgAAAUZJREFUeNpiGEQA0Fgd5rgNw0AU7nvyZHj/E7dKuot0GzuZX6T9mRAIAYaP0AxvJbPTeQO5NccBHS7Z0rV45zACTebCoYCzczUO0M702pGZaR+sp47ZoqltvWI7RZUzRvtwoK5zFtOZCsk5S9A0duLV2RrVTKCcqe6oU3y5Oe5pksJMO8+M75jek2aOY2bS8rwnIYnmAZ05Oo0ZeKisJRBdOwCJnalGla1ux8qC4KGu259+TUgjX9nqttRdAgJrtR3QL3iftsd1l48nJLWjGn5s4blPS0RyeSs7sq2njK0qdGaS8loJMwITc8FMgTQ2nDAaNPyCtsGEVyyxvb+D1DR96RhE/tYTzk6Hlu+acn7Fn+oTRj5hJPYjVk66k2GnjMY+s6b/O4z783csAf6Z7ivW8rNPeffTIOJm1yGBD1gBN7sOwEP9BkH4CoO/C5Xy',
  vandal: 'ABgAAAAgCAMAAAA/gEgKAAAAGFBMVEUKBRIMBQ47JSZTTlGHh5CnJCD+vUX/ehpce6KZAAAAAXRSTlMAQObYZgAAALxJREFUeNq10FFqxSAYROF7zmjc/46rPzHUhvvYgTAwH0aSz78Fvuxpp/Ch8hcImRHMCUa06HzTGIJttHAQ1xVsE8RwQM+EFoj9ETJPJBO0T3gEx3BBZM4P0DWSFs3axy8Qc+/HCcDSe9/QoWL2vkEqOQ/Qb7F2VtbecqfV3ios2Ckw2ZCuPVEKAA11tRoUV5IUTNlJWlgP56+3J0uz1gO0rmxvgKoXQPUb/AJxMIuMQxi9Xcyqzz4E2LXyA2kLBG1PR6IF',
  purun: 'ABgAAAAgCAMAAAA/gEgKAAAAG1BMVEUKBRINCBQ2LD1VS1aHaFKUiHesqn/azKj/sh6waIpeAAAAAXRSTlMAQObYZgAAAOBJREFUeNp1y4WBXVEIRdEFX/pvd+TdHfcMzhEfxcAA/U3MA3gLALdfeBMA7mDQ4S+iC/iH2OvZeAUAFrz+gxvj0QUEQDMPJXAbnEHvM49JzQJilH0MnQAMOufM3Ctui4kqcRthBmvSCawZdof1aguLNWt26fJ0Acti08y4XMAMCygzZxCwOHCqUmvgDjhTAGCJt+8O1dkDC1QhOOA2EzTg17zNY0fdd/g+fYH2SUGh4snpnnOg9iDkHLcjWMUGR2xHZYCBDq0qygyZpWrAPOGahesKd6BDbacpMGAGtEHhEyePox9GUo9m',
  civ: 'ABAAAAAgCAMAAAAsVwj+AAAAGFBMVEUKBRINCBUsHShEND14YVO6nHHo2LHIRjrcFUwRAAAAAXRSTlMAQObYZgAAAINJREFUeNqtjgWCxTAIBfME9v4nrtHQ9a9TzaBjB7EBjAniwOhzYWOKLFo4lakvojMKsMBo4Z0W2LO/CuXHTqIzTpHoPQhQjlPYkUE6WoQjTGIKpngIVRMgkg4RnCkKSzZUAhZEm5ollETsn+5a6FpeZ9K4BNDxN4p63SvQ/CLa1GtjBcteA6t0j9oM',
  boss: 'ADAAAAAwCAMAAABg3Am1AAAAGFBMVEUKBRINBxMyMUhFVnVthrGwyPaiR6xoLmpbZNXcAAAAAXRSTlMAQObYZgAAAdlJREFUeNp000capDoUQ+FfxtT+10uwXuhZ81mjKjji5rBX0O+zPT7xgAKIPQ4NeBSQPa7xHgBP9wYyoXkd/nJkz9MOAM1TGOx5A8BKExjseQVYJODwUbQtQoCuQ3c1ZJiNJ6Gi0mXk1W5qIDcFrXRFRbKJMN1IUmCJDrXK/PJcEFCABpuUnpljaguUwtbQOCKgApq9Aer7lb0h7VotoIDaDC6hNIb6xh32ahVA1toa5gkIAClg8lVP7k+0TdFd+1vsbnDqbtAA1C4CvJqhUSoA+/UmlJVU0KYoDl+FLjSBaMM+wu9BSwJKRVHfCDmtEBJQBAgGX0sRoEUBMD60ajGEAkYythHQllSBaFLB11AatG0BoMmB+ckIcnIriZJGk1lMAAFg5j6BNpM3FbMwQXAQqhXpG6NRKDELAskIVgkVByyNmqjnxFUHknYFCcAB49VyNJUDXiYquhABIBWoiPsEDOCMCCwWklsX5L65CjcGOMFaBWndV2/pnC2XU1stQaIMayypmOHyu+L8Q3Pzc5UJYB1C6Y/Gj/O6Erg1vQKBhPwJgAJxXhWild9FcQBpqpFS+R1veeH/P2H5LQiQhtEqSLRCEcYq8b3pAlASwD8DpW2iACOCQT4AAPypFnVQIkgJ',
  ship: 'AEAAAAAgCAMAAACVQ462AAAAElBMVEUKBRINChJRUluLmJTl5fWM/zry/R61AAAAAXRSTlMAQObYZgAAAXZJREFUeNq1z4FmrFEWBeGvzp/3f+LuswYQWjJyjSnYYJXa/lfyR4KJ/V0QAB54e3jvr4IeP/Bh6C+PPf8g6GPx5gGD4M0A6PcxsOuxAWTMfhAkDChhBmiQYRhAQHiwCygMCJZBtswAQR7eGZzbgQsxgQ1kYIDI2eENVNgQtoLNBwPSszne3/MNGdMCI/a5p9BxB8UQjMI1ONsvBWQIPu/YFIfx/lEAHRcBwRzgfaBxB8BAAmElEzMdbsHrwWz8IDgwLASjw5Wb4wVQF3DcNSo73QkaCBmwzltguepSXKwaIbRRbIdhQMIWx72cMG5CQBMGgim4jjEP91YwxysiTCADiMC1wjzuHPguAAIQgw6DbYQR0Sa4+7IQAIbMwQYcM0Xs+xD6LCAL3jF8efEMCDa5EyAgmMeEt9gIDmQwdEcAIF8vJsCKDTpu2b5eyZjhyyfG/MYwyww+C2CfSYPqOhd8zzk/+H9ld2DbAPJfCQYy/47K/5f/AGD84h/Ol4Gs',
  car: 'ACAAAAAUCAMAAADbT899AAAAHlBMVEUKBRIREBs4PUtdWmR7eoWSiZKkpKzGPDnIyM71a1Ef4D47AAAAAXRSTlMAQObYZgAAAJJJREFUeNqtjAsKhTAMBN181vb+F35JyrMSka8DEtYZenwJOt2Ozr1ISydVAkBM2huwVOTyCN8DpKGWF9NeYEEpLD6XBNhWVG1saF4X4WMFI7+Nm3EFIN2tOAv+qRWBXZxzzgxGUsFsQeJXoOuFKFTVEueTDBRAFSpPIkgNwXsQhQIHXohg3WD/amude9rWBkBfPyyjBnMeCBI3',
  moto: 'ABQAAAAWCAMAAAD3n0w0AAAAElBMVEUKBRIPChZFRU1zc36ur7vEXVu4/1SuAAAAAXRSTlMAQObYZgAAAHpJREFUeNpVzAEKwCAMQ9H9Jt7/yiM0CH4A5+vs98GXem5I5MRe7SWKiu+fe2xwkQeT5sFRorYB2I8lnMyt2AVYsrwYkGZGTkVprz7nmEVWFw8xCSWAIkGYEdiJWPCjFAtas7tHk3mwXzufO9dFFYG1+yjVujSXtz76ARVYAnGOAsUV',
  bg3: 'AFgAAABCCAMAAADkBuH7AAAAKlBMVEX0w8b/9eT81rTkyNitwObAstR/qNqcl8LAikTCcIR/eqiOSy5KLygeFRhmdfgRAAACr0lEQVR42u3UiZbbIAyFYcjgVi7S+79uAeViw3W8dDnr/Oc0iRnylShL+PGf+obRN/wNv7h/A4vmWspbA5xOOofzMczMQ1+0lXQrpD+J5X8DMy9WS7Z1AH9NpRu94cQwi4/89ygSj+LrVhewTvDXk27Dr8uubMgiDD/GGW4l6YWfY79qd2yCMQp/pNfwPZu+IQ9gpl97GT8W7mbAJMcYj+XpmmDvExy9I3vci5GImcVSKLWHx3DssctwLUawy1LdK/hFTZtHtrrRY7j16u62fgj3MwRvwUOCXeYDHsCbCbUU0LaHZxEY3lg2a/2iwvh/y7924WzwcCpfKiOa1KVBmEG7WRzeKe7U2+0g+Kvf1FsHQi8GamknwUXoE8ILGmbGLcPm9gQ8z8/NDe/zYjKWeTM7IcZjd/euiOhQtsx7IccWxkYw1JqNrplls3kvvdYayVgkF2XTYS+dH9WFWV48NTEjOOtuL8higG2Er/JA4CrDimHA5G8LWI9cKa7oQVm1u8Q6TEu7zKCudGTIzDo8LsWRdZdy2cxhYh0eiyXgObPrpdToUoXD1B6Gv/+0q+qhaynGVGicefPoZ67zYEvVNbHT9nKn0H7JVc9owENvWFUbAmr/feSPYU2rewWL1CNzrgEOg1uiA5Pst8R642QxLindgdWHQa6TE1uzEsEk45ZdH8Wo3oNRzlZi2K2ZzSUBe03XRrdrA1u3mtyGNVuXHZ5+i5DWxGFL78wuhtGnQWMdp1trbozR6RPZ/3QB42PkWT+y1AZPagwvx7Bz3ZWWoQE28dZ1NR4GhoscgmBTg/tuLWXTcRq46Vmr0OwyvJUxpOkjN7kmpyLTu3m5Cxhy9kT0fnDFcs1dhyGrl03Wkj4NcESTq4/OS4MpLnLW0HPX9ncLudp65KL25HV1YpvDbzqPjNhMMcl0',
})) ASSETS[k] = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA' + v + 'AAAAAElFTkSuQmCC';

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
  // Played heroes: any value → unique keys of the resistance trio, ['fornax'] when nothing valid is left.
  const cast = h => (h = [...new Set([].concat(h))].filter(x => TRIO.includes(x)))[0] ? h : ['fornax'];
  const crews = x => x == 1 ? 'un equipo' : x + ' equipos';
  const log = x => 'Registro ' + ('' + x).padStart(4, 0);

  // Flags f (choice index per beat): d intro, r market(0)/avenue(1), c civilians(0)/chase(1), v trust Vidnah(0),
  // l Lukxed covers the crew(0), p hire Phelios(0)/reveal Luphomoids(1)/no deals(2), z answer(0)/beacon off(1)/key to Vidnah(2).
  // The chase takes Fornax's escort (if Fornax is played: the escort of the Roraima base);
  // if Lukxed then covers the crew, nobody covers Fornax (or the base) and he (it) falls.
  const fellOf = f => f.c == 1 && f.l == 0;
  const turned = f => f.p == 1 && f.v == 0; // only Vidnah can confirm Luphomoids ride with los Primeros
  // Phelios in the final battle: 1 fights for the crew (hired or turned), 2 second boss beside Phaenon, 0 undecided.
  const phOf = f => f.p == 0 || turned(f) ? 1 : f.p > 0 ? 2 : 0;

  // Any stored value → well-formed world: runs, last crew's name, crews that trusted Vidnah, crews per ending.
  // (v1 worlds kept the trust count in c[2]; it carries over.)
  const clean = w => {
    try {
      w = Object(w);
      const e = Object(w.e);
      return {
        v: 2,
        n: num(w.n ?? w.runs),
        last: (typeof w.last == 'string' ? w.last : '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12),
        t: num(w.t ?? Object(w.c)[2]),
        e: ENDS.map((_, i) => num(e[i])),
      };
    } catch (_) { return clean(); }
  };
  // Any run with flags is usable; its world is re-validated on every call.
  const ok = r => r && r.f ? (r.w = clean(r.w), r) : STORY.newRun();
  // Community goal: trusting crews still needed (this one included) before Vidnah may use the key.
  // Unlocks once at least 5 crews, and a third of all crews, trusted her.
  const needOf = ({ n, t }) => Math.max(5 - t, Math.ceil((n - 3 * t) / 2));
  const endOf = ({ f, w }) => f.z == 2 && f.v == 0 && needOf(w) < 2 ? 3 : f.z == 1 ? 2 : fellOf(f) ? 1 : 0;
  const dlg = (l, c = [], m = 4) => ({ lines: l.filter(Boolean).slice(0, m), choices: c });

  // A beat → [lines, choices, reactions per choice, flag key]. Falsy lines are skipped.
  const scene = (r, id) => {
    const { w, f } = r, n = w.n, need = needOf(w), fell = fellOf(f), vid = f.v == 0, h = cast(r.h);
    // hF: Fornax is in the field, so Qawakun gives the orders (C) and the base is what gets exposed (B).
    const [hF, hS, hL] = TRIO.map(x => h.includes(x)), C = hF ? Q : F, B = hF ? 'la base' : 'a Fornax';
    switch (id) {
      case 'intro':
        // Qawakun's mission log: Registro 0043: ustedes relevan al equipo VLD.
        const memo = n ? Q`${log(n + 1)}: ustedes relevan al equipo ${w.last || n}.` : Q`Probabilidad de éxito: 34%. Redondeando hacia arriba.`;
        return [[
          Q`Soy Qawakun, la IA que nació al unir todas las computadoras para romper QSHA-1024, el cifrado alienígena.`,
          Q`Así supimos que la radiación era un faro. Y los Primeros respondieron.`,
          X`¡FUERA! EL PARAÍSO NO ES DE USTEDES.`,
          Q`La radiación ciega sus visores; yo reconstruyo la imagen. Cada golpe daña nuestro enlace: la SEÑAL.`,
          hF ? Q`General Fornax, usted está al mando.` : F`Aquí el general Fornax, al mando de la resistencia.`,
          C`Los Primeros atacan la antena de El Ávila: sin ella, no hay SEÑAL. Defiéndanla y luego vayan a la base de Roraima.`,
        ], ['CON CAUTELA', 'A FONDO'], [
          [C`Con cautela: menos enemigos.`, memo],
          [C`A fondo: más enemigos.`, memo],
        ], 'd'];
      case 'l1a':
        const go = [C`¡Adelante!`];
        return [[
          C`Mercado: combate cercano. Avenida: más enemigos, a distancia.`,
        ], ['POR EL MERCADO', 'POR LA AVENIDA'], [
          go, go,
        ], 'r'];
      case 'l1b':
        return [[
          C`¡La nave nodriza huye! Con ${hF ? 'la escolta de la base' : 'mi escolta'} pueden arrancarle un núcleo, pero ${hF ? 'la base queda' : 'yo quedo'} sin protección.`,
          ...hS ? [Q`Sumer: hay civiles atrapados, técnicos de mi antena. Si los salvan, reforzarán su enlace.`]
            : [S`Sumer, agente secreta. Norteamérica me envió: les falta potencia de fuego.`,
              S`Hay civiles atrapados. Si me ayudan a sacarlos, sigo con ustedes.`],
        ], ['SALVAR A LOS CIVILES', 'PERSEGUIR LA NAVE'], [
          [hS ? Q`Técnicos a salvo: SEÑAL extra para todos.` : S`Civiles a salvo. Voy con ustedes.`],
          [Q`Núcleo extraído: SEÑAL extra y drones más débiles.`],
        ], 'c'];
      case 'l2a':
        return [[
          V`Soy Vidnah, restauradora de los Primeros. Sanan la Tierra, pero sin ustedes. ¿Para qué un paraíso vacío?`,
          need < 2 ? V`Si confían en mí, al final sabrán qué más sé restaurar.`
            : V`Me faltan ${crews(need)} que confíen en mí para restaurar algo más que planetas.`,
        ], ['CONFIAR EN VIDNAH', 'NO CONFIAR'], [
          [V`En cada punto de control les restauro SEÑAL y revelo a los camuflados.`],
          [V`Como quieran.`],
        ], 'v'];
      case 'l2b':
        const ack = [hL ? Q`Lukxed, en posición.` : L`Copiado.`];
        return [[
          R`El enemigo está aquí: 5.143333°, -60.762500°.`,
          C`Ese mensaje unió al planeta contra la nave enterrada en Roraima. La resistencia los necesita en el tepuy.`,
          f.c == 1 && C`${hF ? 'General, la base sigue' : 'Sigo'} sin escolta.`,
          hL ? Q`Lukxed: desde el Kukenán cubres al equipo, o cuidas ${B}. No ambos.`
            : L`Lukxed, francotirador. Cubro al equipo o cuido ${B}. No ambos.`,
        ], [hL ? t`CUBRIR DESDE EL KUKENÁN` : 'QUE LUKXED NOS CUBRA', (hL ? 'CUIDAR ' : 'QUE CUIDE ') + (hF ? 'LA BASE' : 'A FORNAX')], [
          ack, ack,
        ], 'l'];
      case 'l3a':
        return [[
          !fell ? Q`Aterrizó la nave del escudo. Baja su vanguardia.`
            : C`La nave del escudo aterrizó sobre ${hF ? 'la base' : t`mí`}. Sin escolta ni Lukxed... ${hF ? t`La base cayó, General` : t`Sigan sin mí. Es una orden`}.`,
          K`Phaenon, de Kleper. Nada personal: el arma enterrada es mi botín, y ustedes estorban.`,
          P`Phelios, de la dimensión zero. Mi piel ya está roja: odio todo lo vivo que no me contrató.`,
          Q`Dato: los Luphomoides arrasaron el pueblo de Phelios. Según QSHA-1024, son parte de los Primeros.`,
        ], ['CONTRATAR A PHELIOS', 'REVELAR: HAY LUPHOMOIDES', 'SIN TRATOS'], [
          [P`Mi precio: el arma enterrada. Trato hecho: peleo con ustedes.`],
          vid ? [V`Es cierto, Phelios: yo misma los he restaurado.`, P`Entonces mi guerra es con ellos. Peleo con ustedes.`]
            : [P`¿Sin pruebas? Buen truco. Phaenon, aplastémoslos.`],
          [P`Sin tratos. Phaenon, a ellos: juntos.`],
        ], 'p'];
      case 'l3b':
        return [[
          K`KLEPER... EL BOTÍN... ERA... JUGOSO...`,
          f.p == 0 ? P`Pago cobrado: el arma enterrada es mía.` : !turned(f) && P`Mi piel... se vuelve gris. Nadie me contrató para perder.`,
          Q`Cuenta regresiva: 99%. Con la llave de QSHA-1024 puedo responderles o apagar el faro que los guía.`,
          vid && V`O denme la llave a mí. Sé restaurar más que planetas.`,
        ], ['RESPONDERLES', 'APAGAR EL FARO', ...vid ? ['DARLE LA LLAVE A VIDNAH'] : []], [
          [Q`Transmitiendo en su canal: "Armas en suspensión, apáguense. Esta Tierra tiene dueños."`],
          [Q`Apagando el faro. La Tierra deja de llamarlos.`],
          [need < 2 ? V`Cuento con ${crews(w.t + 1)} de mi lado. Es suficiente.` : V`Aún no: necesito ${crews(need - 1)} más. Qawakun, respóndeles tú.`],
        ], 'z'];
      case 'end':
        return [[
          !fell ? C`${hF ? 'General, l' : t`Aquí Fornax. L`}o lograron. Hoy la resistencia duerme tranquila.`
            : hF ? Q`La base cayó, General, pero seguimos en pie.`
            : R`Mensaje grabado de Fornax: "Si oyen esto, ganamos. Lukxed: no fue tu culpa."`,
          vid && f.z == 2 && need > 1 && V`Guardaré la llave hasta que más equipos confíen en mí.`,
          Q`${log(n + 1)} guardado.`,
        ], []];
    }
  };

  return {
    newRun: (world, players, heroes) => ({ w: clean(world), h: cast(heroes), f: {} }),

    beat(r, id) {
      const s = scene(ok(r), id);
      return s ? dlg(s[0], s[1], id == 'intro' ? 6 : 4) : null;
    },

    // P1 decides for the crew; the vote flag is no longer used.
    choose(r, id, i) {
      r = ok(r);
      const s = scene(r, id);
      if (!(s && s[1][0])) return null;
      r.f[s[3]] = i = Math.min(s[1].length - 1, num(i));
      return dlg(s[2][i]);
    },

    mods(r, lv) {
      r = Object(r);
      const f = Object(r.f), hS = cast(r.h).includes('sumer');
      const h = (f.d == 1 ? 1.1 : f.d == 0 ? .9 : 1) - (lv >= 2 && f.c == 1) * .1
        + (lv >= 3) * ((f.p == 1 && !turned(f)) * .15 + (f.p == 2) * .1 + fellOf(f) * .05);
      return {
        route: f.r == 0 ? 'metro' : 'av',
        // A played hero is never the ally: if Sumer is played, the civilians she saves boost the link instead (+1 max SEÑAL).
        ally: f.v == 0 ? 'vidnah' : f.c == 0 && !hS ? 'sumer' : null,
        sniper: f.l == 0,
        boss: 'phaenon',
        ph: phOf(f),
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
        // story, Phelios's fate (or who fell), the sequel hook, Qawakun's tally; the secret ending closes on canon.
        lines: [
          [t`La Tierra les responde: sus armas se apagan y la barra se congela en 99%.`,
            t`La Tierra responde y sus armas se apagan. ` + (hF ? 'Pero la base de Roraima cae.' : t`Fornax no vivió para verlo.`),
            t`El faro se apaga y la nave del escudo da media vuelta. Estamos a salvo. Y solos.`,
            t`Vidnah gira la llave: 99%... 50%... 0%. Restaura la Tierra sin echarnos, y lo que la medicina nos quitó.`][e],
          e < 3 && (fell && e != 1 ? (hF ? 'La base' : 'Fornax') + t` cayó en el intento.`
            : f.p == 0 ? t`Phelios cobró el arma enterrada. Volverá por más.` : turned(f) && 'Phelios caza Luphomoides entre las estrellas.'),
          (fell && !hF ? 'Qawakun' : 'Fornax') + ': Esto apenas empieza. Nos llaman desde Tokio y El Cairo.',
          `Son el equipo ${k + 1} en ver este final.`,
          e > 2 && t`Antes de todo, solíamos llamarnos humanos.`,
        ].filter(Boolean),
      };
    },

    commit(world, r, name) {
      const w = clean(world), f = Object(Object(r).f);
      // Only a crew that chose at l3b reached an ending.
      if ([0, 1, 2].includes(f.z)) { const e = endOf(ok(r)); w.e[e] = num(w.e[e] + 1); }
      w.t = num(w.t + (f.v == 0));
      w.n = num(w.n + 1);
      w.last = clean({ last: name }).last;
      return w;
    },
  };
})();

// ---- 50-game.js ----
// ARRIVALS: LA INVASIÓN — the game: title, hero select, co-op rail shooter, dialogue, HUD, continue, names, leaderboard.
{
// the minifier hands out its 54 one-letter names in declaration order, so the most used bindings are declared first
let md, G, S, lvl, mt, T, tP, stp, cam, bgSh, run, world, bg, DL, VS;
let tm = 0, M = {}, scores = [];
// hot helpers and tables (the rest of the helpers follow below)
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
  // fast kills pay more: points x 2 / (1 + ln(1 + seconds on screen))
  const f = 2 / (1 + log(1 + tm - e.b));
  p && addSc(p, e.d[2] * f + .5 | 0, e.X, e.Y - e.H);
  s && pop(e.X, e.Y - e.H - 20, up(s), WC[s]);
};
const { hypot, exp, ceil, log } = Math;
const BS = {}, B2 = {}, BB = [BS, B2];
// VS: P2's Primero per hero slot (same weapon behaviour as that hero)
const AL = [['phelios', 'VOID CLAW'], ['vidnah', 'BIO SPORE'], ['phaenon', 'NEOCRUSH']];
// VS: is t on the side player p fights (P1 fights the Primeros, P2 the humans)? h = t is human
const foe = (p, h) => !VS || !h == !p.i;
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
  c: ['civ', 1, 0, 1.05, 0, 2, 2.6, 4, .3],
  // VS: armed human militia (tinted civilians) that only attack P2
  m: ['civ', 1, 120, 1.05, .9, 1, 2.6, 4, .8, .6, 1, 0, 0] };
// level: name, mission + countdown, script (M move s, W waves with | groups, B story beat, X boss)
const LV = [
  ['CENTRO DE CARACAS', R`Defiende la antena del Ávila
CUENTA REGRESIVA 90%`, 'M1 Wtv|dct|vdv M3 Bl1a M2 Wrr|qrd|rvr M3 Wtrt|drd M3 X Bl1b'],
  ['METRO DE CARACAS', R`Escolta a los civiles por el túnel
CUENTA REGRESIVA 96%`, 'M2 Wtc|vpt|cvt M3 Bl2a M2 Wxr|qcx|pvp M4 Wdcd|xrx M3 X Bl2b'],
  ['RORAIMA', R`Responde al llamado de Fornax
5.143333°  -60.762500°`, 'M3 Wxtx|cxd|vxv M3 Bl3a M2 Wpxt|xvx|dpd M3 X Bl3b']];

let AG, ia = 1;
let NW = 1, spd = 0, rt = 0, cz = 0, cx, hy, lr, q, glt = 0, odT, hs, hf, WL, UL, pix, gg, fg, hg, dG, em, si, steps, sT, mv;
let snT, suT, wq, wg, wi, wt, gT, nE, poi = 0, wT = 0, MS = [], FX = [], WA, WX, VD;
let sp, tBar, tB, tPress, TI, SW, sD, dPor, dN, dT, dC = [], bossT, ov, oT, eH, nL;
const KS = 'qn-scores', KW = 'qn-world', E = [], PO = [], PR = [], MG = new Set, VE = [0xffcc00, 0x00247d, 0xcf142b];

// ---- more small helpers
const ring = (w, c, a, x, y, r) => G.lineStyle(w, c, a).strokeCircle(x, y, r);
const line = (w, c, a, x, y, x2, y2) => G.lineStyle(w, c, a).lineBetween(x, y, x2, y2);
const arc = (w, x, y, r, f, c = 0xff2a55) => G.lineStyle(w, c).beginPath().arc(x, y, r, -1.57, 6.28 * f - 1.57).strokePath();
const sr = (w, c, x, y, W, H, a) => G.lineStyle(w, c, a).strokeRect(x, y, W, H);
const box = (c, x, y, w, h) => G.fillStyle(0x0d0620, .9).fillRoundedRect(x, y, w, h, 12).lineStyle(3, c).strokeRoundedRect(x, y, w, h, 12);
const u = o => (UL.add(o), o);
// texture choice in one place: SEÑAL <= 1 shows raw low-res; else the CNN (IA ON) or plain bicubic (IA OFF)
const tk = k => !lr && T.exists(k + '_hd') ? k + (ia ? '_hd' : '_bc') : k;
const retex = () => MG.forEach(o => o.setTexture(tk(o.k)) && o.dw && o.setDisplaySize(o.dw, o.dh));
const arr = v => Array.isArray(v) ? v : [];
const hsh = n => abs(sin(n * 78.23 + lvl * 3.7) * 43758.5) % 1;
const beat = id => sto('beat', null, run, id);
const cyc = (k, a, b, v, n, u = hit(k[a]), d = hit(k[b])) => ((u || d) && au('beep'), (v + n + d - u) % n);
const flash = d => cam.flash(d, 248, 194, 11);
// buttons of each player who has not confirmed yet
const each = f => P.map(p => p.ok || f(p, p.K));
const tint = (s, f, c) => f ? s.setTintFill(0xffffff) : s.setTint(c || 0xffffff);
const foes = () => E.filter(e => e.on && !e.de && e.k != 'c');
const live = () => P.filter(p => p.on && p.hp > 0);
const ok = t => t && t.hp > 0 && !t.de;
// +1 SEÑAL for every living player (Vidnah)
const vheal = () => (live().map(p => p.hp < p.mx && p.hp++), au('heal'), pop(400, 200, R`VIDNAH: +1 SEÑAL`, TEAL));
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
// a floor/ceiling quad at height h, or (z0 == z1) an upright face from h up to h1, narrowing by t at the top
const hq = (c, a, x0, x1, h, z0, z1, h1 = h, t = 0) => Q(c, a, x0, h, z0, x1, h, z0, x1 - t, h1, z1, x0 + t, h1, z1);
const fq = (c, x0, x1, h = 0) => hq(c, 1, x0, x1, h, .4, 40);
const scene = () => {
  const l = lvl, m = l == 2;
  G = gg.clear();
  // ground: avenue + sidewalks / metro: light concrete platform with its yellow safety line, the (black) track pit with two steel rails
  // on dark-blue supports, the ceiling with two long fluorescent strips (Roraima: the painted bg3 is the ground)
  if (l < 2) fq(0x48424f, -2.6, 2.6), fq(0x24212b, -1.7, 1.7);
  else if (m) fq(0x1d3a8c, 1.95, 2.95, -.49), rp(2, i => fq(0xc8c8d0, 2.16 + i * .6, 2.24 + i * .6, -.47)), fq(0x9c968a, -2.2, 1.3), fq(0xf2c200, 1.02, 1.3), fq(0x1c1a22, -2.2, 4, 2.8), rp(2, i => fq(0xe8eeff, i * 1.7 - 1.3, i * 1.7 - 1.18, 2.78));
  for (let j = 13; j >= 0; j--) {
    const n = (cz / 3 | 0) + j, Z = n * 3 - cz, z0 = max(.4, Z), z1 = Z + 3, a = cl(1.7 - z0 / 15, 0, 1), sl = n % 2 * 2 - 1, X = sl * 1.85;
    if (z1 < .5) continue;
    WA = a;
    // lane dash and a street lamp (alternating curbs) with its power line
    if (l < 2) {
      hq(0xd8d0b0, a, -.05, .05, 0, z0, max(z0, Z + 1));
      if (Z > .4) {
        const x = PX(X, Z), y = PY(2.7, Z);
        line(max(1, 18 / Z), 0x4a4658, a, x, PY(0, Z), x, y).lineStyle(1, 0).lineBetween(x, y, PX(X, Z + 6), PY(2.7, Z + 6));
        circ(0xffd27a, a * .3, x, y, 70 / Z); circ(0xffffff, a, x, y, 7 / Z + 1);
      }
    }
    for (let s = -1; s < 2; s += 2) {
      const r = hsh(n * 2 + s), X = WX = m ? s < 0 ? -2.2 : n > 1 && n < 7 ? 1.5 : 3.6 : s * 2.6;
      if (l < 2) {
        // facades: lit windows, shop shutters and signs
        const h = 2.4 + r * 3.6;
        wall([0x2e2a3c, 0x3b2f33, 0x283a40, 0x40392e][r * 4 | 0], z0, z1, 0, h);
        wall(0x57535f, z0, z1 - .3, 0, .85);
        wall([0xff4fd8, 0x50f2c4, 0xf2e205, 0xff6a3d][n % 4], Z + .6, Z + 2.2, .95, 1.25);
        for (let f = 1.6; f < h - .5; f++) rp(2, c => wall(hsh(n * 9 + f * 3 + c + s) < .35 ? 0xffd27a : 0x15131e, Z + .6 + c * 1.4, Z + 1.3 + c * 1.4, f, f + .6));
      } else if (m && n < 7)
        // metro: pale panel walls (dark seams between them) with the orange signage strip (also across the tracks ahead of the train) /
        // the parked train: white body, lit windows, the yellow-blue-red stripe and, first, its rounded cab
        s < 0 || n < 2 ? (wall(0xe2dacb, z0, z1 - .08, 0, 2.8), wall(0xf08a24, z0, z1, 1.7, 2.1))
          : (wall(0xdfe3ea, z0, z1, -.4, 1.9), wall(0xfff0c0, Z + .3, Z + 2, .75, 1.4),
            rp(3, i => wall(VE[i], z0, z1, .66 - (i *= .08), .74 - i)),
            n < 3 && Z > .5 && (hq(0xff4a1c, a, 1.5, 3.5, -.4, Z, Z, 1.9, .2), hq(0x111111, a, 1.7, 3.3, .25, Z, Z, 1.75, .15),
              rp(2, i => circ(0xfff6c0, a, PX(1.9 + i * 1.2, Z), PY(.42, Z), 30 / Z))));
      // tunnel: dark walls with passing lights
      else if (m) wall(0x1c1a20, z0, z1, -.5, 2.8), Z > .5 && circ(0xffe0a0, a, PX(X * .95, Z), PY(1.8, Z), 40 / Z);
    }
  }
  // cars and motorbikes parked along the curbs or crashed: depth-sorted sprites enemies use as cover
  rp(8, j => {
    const n = (cz / 4 | 0) + j, o = PR[n % 8], z = n * 4 + hsh(n) * 2 - cz, mo = hsh(n + 3) < .3, cr = hsh(n + 7) < .3, s = o.s, k = mo ? 'moto' : 'car';
    s.visible = o.on = l < 2 && z > .6; o.x = (hsh(n + 9) < .5 ? -1 : 1) * (cr ? .5 : mo ? 1.45 : 1.15); o.z = z;
    o.on && pos(stx(s, k).setTint([0xd04040, 0x4060d0, 0xe0e0e0, 0x555560, 0xe0b030][n % 5]), PX(o.x, z), PY(0, z), (mo ? 280 : 700) / z / s.frame.width, 40 - z);
  });
};

// ---- enemies and enemy shots
const spawn = k => {
  const e = E.find(e => !e.on), sd = rand() < .5 ? -1 : 1, c = k == 'x' && M.ally != 'vidnah', cv = pick(PR.filter(o => o.on && o.z > 2 && o.z < 5.5)), r = rand();
  k = { x: 't', r: M.m ? 'v' : 't', q: M.m ? 'd' : 'c' }[k] || k;
  VS && (k == 'c' || k != 'p' && rand() < .45) && (k = 'm');
  const d = ET[k], z = rnd(d[6], d[7]), gr = k == 't' || k == 'v';
  if (!e) return;
  stx(e.s, d[0]).visible = 1;
  OA(e, { b: tm, on: 1, k, d, hp: d[1] + (lvl > 2 && k == 't'), st: 0, cl: c, r: rnd(0, 6), t: rnd(1.5, 3), de: 0, fl: 0,
    x: sd * 2.3 * NW, z, h: k == 'd' ? 3 : 0, x1: (k == 'c' ? -sd * 3.5 : rnd(-1, 1)) * NW, z1: z, h1: k == 'd' ? rnd(.45, 1) : 0 });
  // pop-out origins (House of the Dead; on the Roraima platform everything is narrower): out of a doorway, off a rooftop, from behind a car, out of the train, or from the depth
  if (k == 'p') e.x = rnd(-1, 1) * NW, e.z = 9;
  else if (gr && lvl == 2) e.x = 1.5, e.x1 = rnd(-1.6, .8);
  else if (gr && cv && r < .5) e.x = cv.x, e.z = e.z1 = cv.z + .3, e.x1 = cv.x * .2;
  else if (gr && r < .75) e.h = 3;
  return e;
};
// an enemy shot flying at the camera; g = an artillery zone on the ground that blows up after g seconds
const shot = (x, h, z, c, g, T) => { const b = B.find(b => !b.on); b && (OA(b, { on: 1, x, h, z, g, T, v: (z - .7) / 1.6 * AG }).s.setTint(c).visible = 1); };
const eUp = (e, dt) => {
  if (e.de) return (e.de -= dt) <= 0 && off(e);
  const d = e.d, f = min(1, dt * (e.st ? 3 : d[8] * 2)), a = tm * d[10] + e.r;
  // approach the stop point; once active: drones fly a figure-8 and dive to attack, raiders zig-zag in,
  // guardians stomp forward, troopers strafe and duck behind cover (melee enemies step back in after a hit)
  e.x += (e.x1 + (e.st && sin(a) * d[9] * NW) - e.x) * f;
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
    const T = VS ? +(e.k == 'm') : null;
    d[5] ? shot(e.x, e.h + d[3] * .5, e.z - .2, e.k == 'd' ? 0x50f2c4 : 0xff3d6e, 0, T) : (hurt(T), e.z += .7);
  }
};
const eDraw = (e, dt) => {
  const s = e.s, d = e.d, h = e.H = d[3] * 330 / e.z, x = e.X = PX(e.x, e.z), y = e.Y = PY(e.h, e.z);
  const c = h / s.frame.height, w = e.W = pos(s, x, y, c, 40 - e.z, c * (e.dk ? .55 : 1)).displayWidth;
  e.C = y - h / 2;
  gg.fillStyle(0, .4).fillEllipse(x, PY(0, e.z), w * .9, h * .1 + 2);
  tint(s, e.de > 0 || (e.fl -= dt) > 0, e.st > 1 && tm * 9 % 2 < 1 && 0xff4060 || e.k == 'm' && 0xffa040);
  s.alpha = e.de > 0 ? e.de * 4.5 : e.cl && e.st < 2 ? .13 + .08 * sin(tm * 30) : 1;
  // telegraph: red countdown arc; civilian "don't shoot" marker
  e.st > 1 && !e.de && arc(6, x, e.C, max(w, h) * .55 + 6, e.tt / d[4]);
  e.k == 'c' && ring(4, 0x50f2c4, 1, x, y - h - 14, 7);
  e.k == 'p' && circ(0xf8c20b, .45 + .3 * sin(tm * 9), e.ex = x - w * .2, e.ey = y - h * .8, h * .06 + 3);
};

// ---- bosses, up to two at once (BB = [BS, B2]): kind 1 ship, 2 guardian, 3 Phaenon (final), 4 Phelios (second final boss, or the ally: b.al)
// table: texture, start y, name, weak points [x, y offsets in sprite sizes, hp, radius px]; tt = telegraph timer
const BT = [['ship', -120, 'NAVE DE LOS PRIMEROS', [[-.27, .3, 9, 30], [0, .38, 9, 30], [.27, .3, 9, 30]]], ['purun', 700, R`GUARDIÁN ANCESTRAL`, [[-.2, -.8, 28, 36]]],
  ['trooper', 560, 'PHAENON', [[.09, -.86, 14, 36], [.2, -.57, 14, 36], [-.43, -.5, 12, 36]]], ['boss', 520, 'PHELIOS', [[.1, -.58, 30, 80]]]];
// the hostile bosses on screen (dying ones too) / still fighting
const hb = () => BB.filter(b => b.on && !b.al);
const bos = () => hb().filter(b => !b.de);
const bossStart = () => {
  // L3: M.ph 1 = Phelios fights at your side, 2 = Phelios is a second boss; VS: the second boss is P2's hologram hero
  const k = lvl, ph = k > 2 && M.ph;
  BB.map((b, i) => {
    // VS: P2's boss is a giant hologram of the level's hero (kinds 5-7)
    const q = i ? VS ? 4 + k : 4 : k, o = HE[k - 1][0], [tx, y, nm, w] = q > 4 ? [o, 290, up(o), [[0, -.1, 25 + k * 5, 70]]] : BT[q - 1];
    OA(b, { on: !i || ph || VS, k: q, al: i && !VS && ph < 2, de: 0, fl: 0, t: 2.5, sh: 0, x: 400, y, vd: !i && k > 2 && M.ally != 'vidnah', mx: 0, c: 0 });
    b.w = b.al ? [] : w.map(([x, y, hp, r]) => (b.mx += hp, { x, y, hp, r, m: hp }));
    b.on && (stx(b.s, tx).setOrigin(.5, q < 2 || q > 4 ? .5 : 1).visible = 1);
    i ? VS && bossT.setText(bossT.text + ' · ' + nm) : bossT.setText(ph > 1 ? 'PHAENON · PHELIOS' : nm);
  });
  banner(R`¡ALERTA!`, bossT.text, PH[1]); au('boss'); mus(4);
  k < 2 && (bgSh.visible = 0);
  // 2P: suggested roles
  live()[1] && !VS && pop(400, 262, R`P1 DEFIENDE · P2 ATACA`, TEAL, 22, 3000);
};
const bossChk = b => {
  if (!b.de && b.w.every(w => w.hp <= 0)) {
    b.de = 2.2; hs = .2; au('kill'); cam.shake(700, .02);
    (VS ? [P[+(b.k > 4)]] : live()).map(p => p.sc += 3000);
    banner(R`¡JEFE DERROTADO!`, '+3000', YEL);
  }
};
// boss hit test around (x, y) with radius r: n damage, weak points take x wm
const bossHit = (p, x, y, r, n, wm) => bos().filter(b => foe(p, b.k > 4)).some(b => {
  const k = b.k, top = b.y - b.H * b.s.originY;
  // Vidnah's hologram cannot be destroyed: a hit only staggers her (no healing for 4 s)
  if (b.vd && hypot(x - VD.x, y - VD.y) < 60 + r) return b.vs > 1 || (b.vs = 4, pop(x, y - 40, R`¡INTERRUMPIDA!`, TEAL)), boom(6, x, y), 1;
  if (abs(x - b.x) > b.W * .45 + r || y < top - r || y > top + b.H + r) return;
  for (const w of b.w) if (w.hp > 0 && hypot(x - w.X, y - w.C) < w.r + r) {
    // closed: the L2 eye between volleys, Phaenon's shield, Phelios unless green
    if (k == 2 ? !(b.op > 0) : k == 3 ? b.sh : k > 3 && b.ci < 2) return tm > wT && (wT = tm + 1.5, pop(x, y - 30, k < 4 ? R`¡ESCUDO!` : R`¡SOLO EN VERDE!`, '#B98CFF')), 1;
    w.hp -= n * wm; b.fl = .05; boom(6, x, y); au('hit'); combo(p); p.sc += 30 * p.mu;
    w.hp > 0 || boom(40, x, y);
    return bossChk(b), 1;
  }
  return boom(2, x, y), 1;
});
const bossUp = (b, dt) => {
  // shots per burst / volley are fewer solo; two bosses share the plateau (Phaenon left, Phelios right)
  const k = b.k, n = live()[1] ? 5 : 3, w0 = b.w[0], two = hb()[1];
  if (b.de) {
    rand() < .35 && boom(14, b.x + rnd(-.4, .4) * b.W, b.y - (k < 2 ? rnd(-.4, .4) : rnd(.1, .9)) * b.H) && cam.shake(80, .01);
    // shrinking away (bossDraw); L3: thrown off the side of the platform, down into the clouds
    k > 2 && (b.x += (b.x < 400 ? -360 : 360) * dt, b.y += (b.de > 1.6 ? -200 : 420) * dt);
    // the fight ends when the last hostile boss is gone
    return (b.de -= dt) <= 0 && (off(b), hb()[0] || (BB.map(off), E.map(off), mus(lvl), nextStep()));
  }
  b.t -= dt * AG; b.op -= dt; b.vs -= dt;
  // ship / guardian / Phaenon (shield phases): swaying, on the left when there are two bosses
  if (k < 4) b.x = (two ? 260 : 400) + sin(tm * .7) * (two ? 110 : 190), k < 3 ? b.y += ((k < 2 ? 150 : 600) + sin(tm * 1.3) * 20 - b.y) * dt * 1.5 : b.sh = tm % 7 < 4;
  // VS hologram
  else if (k > 4) b.x = 560 + sin(tm * .7) * 110;
  // Phelios at your side: his magenta beam bites Phaenon every 3 s
  else if (b.al) b.x = 690 + sin(tm) * 20, b.t < 0 && (b.t = 3, (w => w && (fx(0xff4fd8, b.x, b.y - b.H * .6, w.X, w.C), w.hp -= 2, bossChk(BS)))(BS.w.find(w => w.hp > 0)));
  // Phelios as a boss: skin colour = combat mode (violet blinks along the plateau, red fires the VOID CLAW volley, green is vulnerable)
  else (b.ci = (tm / 1.7 | 0) % 3) || (b.x = 540 + 110 * sin((tm * 3 | 0) * 2.4));
  // Vidnah heals Phaenon unless a hit staggered her (slower solo); as the ally she pulses SEÑAL to the players instead
  b.vd ? b.vs > 0 || b.w.map(w => w.hp > 0 && (w.hp = min(w.m, w.hp + dt * n * .07))) : k == 3 && ((b.vh -= dt) > 0 || (b.vh = 7, vheal()));
  // telegraph a weak point, then it fires; Phaenon: a fast burst of green shots every 1.2 s and artillery zones every third time;
  // the L2 eye opens for 1.8 s after each volley (its damage window); Phelios fires in red
  if (b.t <= 0 && !b.al && (k != 4 || b.ci == 1)) {
    const w = pick(b.w.filter(w => w.hp > 0));
    b.t = k < 2 ? 1.8 : k < 4 ? 1.2 : 2.6;
    w && (w.tt = .75);
  }
  b.w.map(w => w.tt > 0 && (w.tt -= dt) <= 0 && w.hp > 0 && (k == 2 && (b.op = 1.8), k == 3 && ++b.c % 3 < 1 && rp(n, () => shot(rnd(-.9, .9), 0, rnd(1.6, 3), 0xff3d3d, 2.4)),
    rp(k < 2 || n, i => shot((w.X - 400) / 175 + cx + (i - 1) * .4, 1 - (w.C - hy) / 103, 3.2 + (k == 3) * i * .35, k == 3 ? 0x73ff8a : 0xff3d6e, 0, VS ? +(k > 4) : null))));
};
const bossDraw = (b, dt) => {
  const s = b.s, k = b.k, w0 = b.w[0];
  // VS hologram: the hero's HD portrait in cyan, softly pulsing
  k > 4 && (s.alpha = .75 + .2 * sin(tm * 4));
  pos(s, b.x, b.y, (k < 2 ? 470 / s.frame.width : (k < 3 ? 440 : b.al ? 200 : 300) / s.frame.height) * (b.de ? b.de / 2.2 : 1), 9);
  b.W = s.displayWidth; b.H = s.displayHeight;
  // Phaenon white-green; Phelios: combat colours, or magenta as the ally
  tint(s, b.de > 0 || (b.fl -= dt) > 0, k > 2 && (k < 4 ? 0xd8ffe0 : k > 4 ? 0x80e8ff : b.al ? tm % 1 < .5 ? 0xff4fd8 : 0xff9ae8 : [0xb98cff, 0xff3d3d, 0x73d90d][b.ci]));
  b.w.map(w => {
    w.X = b.x + w.x * b.W; w.C = b.y + w.y * b.H;
    w.hp > 0 && !b.de && ((k == 2 ? b.op > 0 : k < 2 || k > 4) && circ(k < 2 ? 0xff4fd8 : 0xf8c20b, .5 + .3 * sin(tm * 10), w.X, w.C, w.r * .8), w.tt > 0 && arc(6, w.X, w.C, 44, w.tt / .75));
  });
  b.sh && ring(6, 0xb98cff, .9, b.x, b.y - b.H / 2, b.H * .62);
  // Vidnah's hologram (her HD portrait, green aura) beside Phaenon, and her healing beam
  if (b.vd && !b.de) {
    const x = b.x + (b.x < 400 ? 210 : -210), y = 220;
    VD.setPosition(x, y).alpha = b.vs > 0 ? .3 : .8;
    circ(0x73d90d, .2, x, y, 90);
    b.vs > 0 || line(4 + 3 * sin(tm * 20), 0x73d90d, .7, x, y, w0.X, w0.C);
  }
};

// ---- players and weapons
const addSc = (p, v, x, y) => { p.sc += v *= p.mu; pop(x, y, '+' + (v | 0), p.H); };
const combo = p => { const m = min(8, 1 + (++p.ch / 6 | 0)); m > p.mu && pop(p.x, p.y - 50, 'COMBO x' + (p.mu = m), YEL, 36); };
// a hit lands on a random living player (or on player i when given)
const hurt = (i, f) => {
  const p = i == null ? pick(live()) : P[i];
  if (!p || p.hp <= 0 || p.inv > 0 && !f) return;
  p.hp--; p.inv = 1.2; p.ch = 0; p.mu = 1; glt = .5;
  cam.shake(260, .016); hf = 1; au('hurt');
  pop(p.u, 505, R`-1 SEÑAL`, RED, 26);
  // VS: a life lost, back at full SEÑAL; the third one ends the match
  VS && !p.hp && (--p.lv ? (p.hp = p.mx, p.inv = 2.5, pop(p.u, 470, '-1 VIDA', RED)) : ending());
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
    if (t.k == 'c') t.de = .3, au('civ'), pop(t.X, t.Y - t.H, R`¡CIVIL! -1 SEÑAL`, RED), hurt(p.i, 1);
    // VS: hitting your own side costs points
    else if (!foe(p, t.k == 'm')) t.de = .3, au('civ'), p.sc = max(0, p.sc - 300), pop(t.X, t.Y - t.H, R`¡ALIADO! -300`, RED);
    else {
      t.fl = .07; boom(5, t.X, t.C); combo(p);
      (t.hp -= (n || (t.z < 2.6 ? 1 : .5)) * (t.k == 'p' && hypot(x - t.ex, y - t.ey) < t.H * .12 + 8 + r ? 3 : 1)) > 0 ? au('hit') : kill(t, p);
    }
    if (!all) return;
  }
  bossHit(p, x, y, r, n || .5, p.h > 1 ? 2 : 1) || k || (p.ch = 0, p.mu = 1, boom(2, x, y));
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
  foes().map(e => foe(p, e.k == 'm') && (f || --e.hp <= 0) && kill(e, p));
  bos().filter(b => foe(p, b.k > 4)).map(b => { let n = b.mx / (f ? 4 : 16) | 0; for (const w of b.w) { const m = min(max(w.hp, 0), n); w.hp -= m; n -= m; } bossChk(b); });
};
// lockable targets left to right: visible enemies and the boss's weak points
// the boss is up and not dying
const tgs = () => [...foes().filter(e => e.st), ...bos().flatMap(b => b.w.filter(w => w.hp > 0))].sort((a, b) => a.X - b.X);
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
  if (!t) for (const e of foes()) e.st && foe(p, e.k == 'm') && d(e) < bd && (bd = d(e), t = e);
  if (t) { const f = min(1, dt * (p.lk ? 12 : p.a > .4 ? 1.5 : 6)); p.x += (t.X - p.x) * f; p.y += (t.C - p.y) * f; }
  (hit(k[4]) | btn(k[4])) && p.cd <= 0 && fire(p);
  hit(k[5]) && p.am < H[8] && p.rl <= 0 && (p.rl = H[9], au('reload'));
  hit(k[6]) && bomb(p);
};

// ---- flow
const upMods = () => {
  M = VS ? {} : OA({}, sto('mods', {}, run, lvl));
  AG = M.hard = cl(+M.hard || 1, .6, 1.6); M.m = M.route == 'metro';
  const mx = M.extra ? 6 : 5;
  P.map(p => p.mx != mx && (p.hp > 0 && (p.hp = cl(p.hp + mx - p.mx, 1, mx)), p.mx = mx));
};
// START -> hero select (each player: joystick + B1; P2 cannot take P1's hero) -> intro -> level 1
const startGame = n => {
  VS = 0; mode(SEL, 20); nE = -1; vis(TI, 0); vis(SW, 1);
  P.map(p => (p.on = p.i < n, p.ok = !p.on));
};
const selUp = () => {
  // 2P: B3 toggles CO-OP / VS
  P[1].on && ah(6) && (VS ^= 1, au('beep'));
  each((p, k) => (p.h = cyc(k, 2, 3, p.h, 3), (hit(k[4]) || mt < 0) && (!VS && P.some(o => o != p && o.on && o.ok && o.h == p.h) ? mt < 0 ? p.h = (p.h + 1) % 3 : au('empty') : (p.ok = 1, au('reload')))));
  // cursors: P1 / P2 frames around the hovered hero, thicker once confirmed
  G = hg;
  P.map(p => { const o = p.i * 6; p.on && sr(p.ok ? 8 : 4, p.C, 70 + p.h * 260 + o, 86 + o, 140 - o * 2, 168 - o * 2); });
  const J = P.filter(p => p.on);
  sD.setText((J[1] ? R`B3 · ${VS ? 'VS: HUMANOS vs PRIMEROS' : 'CO-OP'}
` : '') + J.map(p => R`${p.n} ${up(hn(p)[0])}${p.ok ? R` ✔` : ''} · ${VS && p.i ? AL[p.h][1] : HE[p.h][3]}`).join('\n'));
  const n = P[1].on + 1;
  if (P.every(p => p.ok)) {
    vis(SW, 0);
    run = sto('newRun', {}, world, n, J.map(p => HE[p.h][0]));
    P.map(p => (p.bo = 2, p.bc = 0, p.mx = 5, p.bs = 0, p.lv = 3, reset(p), p.on = p.pl = p.ok = p.i < n, p.x = 300 + p.i * 200, p.y = 330));
    lvl = 1; au('start');
    VS ? startLevel(1) : dialog(beat('intro'), 'intro', () => startLevel(1));
  }
};
const setBg = () => {
  // L3: the painted Roraima summit, full screen; otherwise El Ávila on the horizon
  stx(bg, lvl > 2 ? 'bg3' : 'av').setOrigin(.5, lvl > 2 ? .5 : 1);
  bg.visible = bgSh.visible = lvl != 2;
};
// a player's hero or (VS, P2) Primero: name, weapon
const hn = p => VS && p.i ? AL[p.h] : HE[p.h];
const startLevel = n => {
  const L = LV[n - 1];
  let a = M.ally;
  lvl = n; NW = n > 2 ? .6 : 1; steps = L[2].split(' '); si = -1; cz = 0; upMods(); setBg();
  // mission card
  banner(VS ? 'RESISTENCIA vs PRIMEROS' : R`MISIÓN ${n} · ${L[0]}`, L[1], PH[0]); mus(n); md = PLAY; snT = 6; suT = 4;
  (a = a || M.sniper && 'lukxed') && pop(400, 300, up(a) + ' TE CUBRE', WC[a]);
  nextStep();
};
const nextStep = () => {
  const s = steps[++si];
  if (!s) return lvl < 3 ? startLevel(lvl + 1) : VS ? ending() : dialog(beat('end'), 'end', ending);
  const a = s.slice(1);
  stp = s[0]; sT = 0;
  if (stp == 'M') mv = +a;
  else if (stp == 'W') wq = a.split('|'), wg = wi = gT = 0, wt = .4;
  else if (stp == 'B') VS ? nextStep() : dialog(beat(a), a, nextStep);
  else bossStart();
};
const waveUp = dt => {
  const g = wq[wg];
  if (g) wi < g.length ? (wt -= dt) <= 0 && (spawn(g[wi++]), wt = .75) : (foes().length < 2 || (gT += dt) > 9) && (wg++, wi = gT = 0, wt = .4);
  else if (!foes().length) {
    // checkpoint: Vidnah (if she defected) restores +1 SEÑAL
    const v = M.ally == 'vidnah';
    live().map(p => p.sc += 500);
    v ? vheal() : pop(400, 200, R`¡ZONA LIMPIA! +500`, TEAL, 30);
    nextStep();
  }
};
const playUp = dt => {
  P.map(p => hit(p.K[7]) && !(p.on && p.hp > 0) && revive(p));
  if (hs > 0) return hs -= dt;
  odT -= dt; sT += dt;
  live().map(p => ctrl(p, dt));
  stp == 'M' ? sT > mv && nextStep() : stp == 'W' ? waveUp(dt) : stp == 'X' && BB.map(b => b.on && bossUp(b, dt));
  E.map(e => e.on && eUp(e, dt));
  // shots that reach the camera hurt; artillery zones blow up when their timer ends
  B.map(b => b.on && (b.g ? (b.g -= dt) < 0 && (off(b), boom(30, b.X, b.Y), hurt(b.T)) : (b.z -= b.v * dt, b.x -= b.x * dt * .6, b.h += (.85 - b.h) * dt * 1.5, b.z < .7 && (off(b), hurt(b.T)))));
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
  DL = { ls, ch, id, cb, i: -1, n: 0, c: 0, t: 0 };
  mode(DLG, mt); vis([dN, dT], 1); nextLine();
};
const nextLine = () => {
  const D = DL, l = D.ls[++D.i];
  if (l) {
    const k = T.exists(l.who) && l.who;
    D.n = D.w = 0;
    dN.setText(up(l.name || '')).setColor(WC[k] || (k ? GOLD : RED));
    D.s = dT.setText('').getWrappedText(l.text).join('\n');
    porVis(dPor, !!k);
    k && k != D.k && porSet(dPor, k);
    D.k = k;
  } else if (D.ch.length && !D.vo) {
    D.vo = 1;
    dT.setText(D.s + R`
▲▼ + B1`);
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
  // P1 picks (a B1 double-tap on the last line must not pick before the choices are seen)
  const k = P[0].K;
  D.t += dt; D.c = cyc(k, 0, 1, D.c, n);
  (hit(k[4]) && D.t > .4 || D.t > 15) && (au('reload'), dialog((D.r = sto('choose', null, run, D.id, D.c), upMods(), vis(dC, 0), D.r), D.id, D.cb, 1));
};
const dlgDraw = dt => {
  const D = DL, c = +('0x' + dN.style.color.slice(1)), n = D.ch.length, y0 = 384 - n * 52;
  G = dG; box(c, 14, 398, 772, 194);
  sr(2, c, 26, 410, 140, 168);
  if (D.k) { const y = porUp(dPor, dt * 2.2); dPor.p < 1 && rect(0xf8c20b, 1, 24, y - 2, 144, 4); }
  D.vo && box(0xf8c20b, 130, y0, 540, n * 52 + 12) && rp(n, j => {
    const y = y0 + 32 + j * 52;
    dC[j].setY(y);
    // P1's cursor
    D.c == j && G.fillStyle(0xd9f21b).fillTriangle(160, y - 12, 160, y + 12, 178, y);
  });
};

// ---- ending, names, leaderboard, title
const ending = () => {
  // VS: the other side wins when someone ran out of lives, else the higher score
  const e = VS ? { title: P[0].lv < 1 || P[1].lv && P[1].sc > P[0].sc ? 'GANAN LOS PRIMEROS' : 'GANA LA RESISTENCIA', lines: ['RESISTENCIA ' + pad(P[0].sc), 'PRIMEROS ' + pad(P[1].sc)] } : sto('ending', {}, run);
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
  store.set(KS, scores);
  nE = scores.findIndex(e => e.n == b.nn && e.s == b.sc);
  world = sto('commit', world, world, run, b.nn, b.sc);
  store.set(KW, world);
  toTitle();
};
// stored scores: 3-letter names and non-negative scores only, best 5
const valid = v => arr(v).filter(e => /^\w{3}$/.test(e && e.n) && e.s >= 0).sort((a, b) => b.s - a.s).slice(0, 5);
const toTitle = () => {
  mode(TITLE, 0); lr = odT = DL = 0; BB.map(off); vis(nL, 0);
  [...E, ...B].map(off);
  P.map(p => p.on = p.pl = 0);
  lvl = 1; setBg(); retex(); mus(0); vis(TI, 1); porSet(tP, 'fornax');
};
// boot splash: "PLATANUS HACK 26, CARACAS · presenta"; fades in and out over 3.4 s, START or B1 skips
const splUp = () => {
  const a = min(1, (3.4 - mt) * 2, mt * 2);
  G = hg; rect(0, 1, 0, 0, 800, 600);
  vis(sp, 1); sp.map(t => t.alpha = a);
  (mt < 0 || ah(4) | ah(7)) && (vis(sp, 0), toTitle());
};
const titleUp = dt => {
  const y = porUp(tP, dt * .5), n = tP.p * 10 | 0;
  tP.p < 1 || (tP.t += dt) < 2.5 || porSet(tP, 'fornax');
  tBar.setText(R`QAWAKUN RECONSTRUYENDO SEÑAL
` + R`▓`.repeat(n) + R`░`.repeat(10 - n) + R` ${n * 10}%
B6 · ` + iaT());
  tPress.alpha = tm % 1 < .65 ? 1 : .2;
  tB.setText('TOP 5\n\n' + [0, 1, 2, 3, 4].map((i, _, a, e = scores[i]) => (i == nE ? R`► ` : '') + `${i + 1}. ${e ? e.n + '   ' + pad(e.s) : '---   -------'}`).join('\n'));
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
  // backdrop: El Ávila closing the avenue, or the Roraima painting with a slow push-in, pan and bob while walking
  const b3 = lvl > 2;
  pos(bg, 400 - cx * 30, b3 ? 240 + sin(rt * 6) * 3 : hy, b3 ? 800 / bg.frame.width * (1.25 + cz * .003) : 1);
  pos(bgSh, 400 + sin(tm * .08) * 160, 66 + sin(tm * .7) * 8, 300 / bgSh.frame.width);
  scene();
  // the mothership, its shield "against everything" and its glow
  const x = bgSh.x, y = bgSh.y, sh = sin(tm * 3);
  bgSh.visible && G.lineStyle(2, 0xb98cff, .35 + .25 * sh).strokeEllipse(x, y, 370 + 8 * sh, 150 + 4 * sh) && circ(0xf4e4ff, .1, x, y, 160);
  G = fg.clear();
  for (const e of E) e.on && eDraw(e, dt);
  for (const b of B) if (b.on) {
    const r = b.r = 75 / b.z;
    pos(b.s, b.X = PX(b.x, b.z), b.Y = PY(b.h, b.z), r / 8 * (1 + .2 * sin(tm * 40)), 41 - b.z);
    circ(0xffffff, .9, b.X, b.Y, r * .3);
    // an artillery zone: its countdown circle
    b.g && arc(5, b.X, b.Y, r * 1.8, b.g / 2.4);
  }
  VD.visible = BS.on && BS.vd && !BS.de;
  BB.map(b => b.on && bossDraw(b, dt));
  MS.map(m => m.X && circ(0xfff0c0, 1, m.X, m.Y, 7));
  // beams, tracers, blasts and shockwaves
  FX = FX.filter(f => (f.t -= dt) > 0);
  FX.map(f => { const a = f.t / .35; f.Y ? line(10 * a + 2, f.c, a, f.x, f.y, f.X, f.Y) : ring(14 * a + 2, f.c, a, f.x, f.y, f.X * (1.2 - a)); });
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
    p.N.setText(up(hn(p)[0]) + ' · ' + hn(p)[1]).visible = on && p.on;
    if (!on) continue;
    box(c, x0, 528, 322, 66);
    // SEÑAL bars, ammo, Overdrive charges
    al && rp(18, j => {
      j < p.mx && rect(j < p.hp ? p.hp > 3 ? 0xd9f21b : p.hp > 1 ? 0xf2e205 : 0xff3d5a : 0x2a1f40, 1, x0 + 14 + j * 24, 573, 20, 14);
      j < n && rect(j < am ? lc(0xf2e205, 0xff3d5a, min(1, p.hx)) : 0x2a1f40, 1, x0 + 168 + j * 84 / n, 566, 84 / n - 2, 21);
      j < 2 && circ(j < p.bo ? 0xf8c20b : 0x2a1f40, p.bc > 0 ? .3 : 1, x0 + 274 + j * 22, 576, 8);
      // VS lives
      VS && j < 3 && circ(j < p.lv ? 0xff5a5a : 0x2a1f40, 1, x0 + 262 + j * 18, 545, 6);
      !j && p.bc > 0 && p.bo && arc(3, x0 + 252 + p.bo * 22, 576, 11, 1 - p.bc / 25, 0xf8c20b);
    });
  }
  // one bar for all the hostile bosses
  const H2 = hb(), bh = f => H2.reduce((a, b) => a + f(b), 0);
  (bossT.visible = bos()[0] && on) && rect(0x0d0620, .85, 196, 36, 408, 20) && rect(0xff4fd8, 1, 200, 40, bh(b => b.w.reduce((a, w) => a + max(0, w.hp), 0)) * 400 / bh(b => b.mx), 12);
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
  BS.s = w(img()); B2.s = w(img());
  // sized by retex() (toTitle)
  VD = OA(stx(w(img()), 'vidnah').setTint(0x9cffb0), { dw: 110, dh: 132 });
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
  SW = [tx(400, 36, 34, GOLD, R`ELIGE TU HÉROE`), sD = tx(400, 452, 15),
    tx(400, 545, 14, TEAL, R`B1 DISPARAR · B2 RECARGAR · B3 QAWAKUN OVERDRIVE
B4 FIJAR OBJETIVO · B6 IA GRÁFICA ON/OFF · JOYSTICK APUNTAR`)];
  HE.map((h, j) => {
    // display size applied by retex() (title)
    const x = 140 + j * 260, o = OA(pos(stx(u(img()), h[0]), x, 170), { dw: 120, dh: 144 });
    SW.push(o, tx(x, 330, 15, WC[h[0]], R`${up(h[0])}
${h[1]} · ${h[2]}
DAÑO ${h[4]} · CAD ${h[5]} · ALC ${h[6]}`));
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
  eH = tx(400, 565, 20, YEL, R`▶ B1 CONTINUAR`);
  nL = P.map(p => tx(0, 300, 44, p.H));
  // popup texts (empty until pop() uses them)
  rp(16, () => PO.push(tx(0, 0, 22)));
  dlgOff(); vis(SW, 0);
  safe(() => AU.init(S.sound.context));
  store.get(KS).then(r => scores = valid(r && r.value));
  store.get(KW).then(r => r && r.found && (world = r.value));
  sp = [tx(400, 281, 26, WH, 'PLATANUS HACK 26, CARACAS'), tx(400, 334, 22, WH, 'presenta')];
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
