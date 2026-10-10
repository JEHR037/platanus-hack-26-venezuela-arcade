# ARRIVALS: LA INVASIÓN — design notes

A House-of-the-Dead-style co-op rail shooter for the **Platanus Hack 26 Caracas Arcade Challenge**, set in the author's
*The Arrivals* universe.

Constraints:
- **Engine and size:** Phaser 3.87 (loaded from CDN, not counted). `game.js` must be **≤ 50 KB (51,200 bytes) after minification**.
- **Sandbox:** no network, no imports, no `http://` or `//word` in the source.
- **Hardware:** runs on a physical 2-player cabinet: per player, a joystick, 6 buttons and START. No keyboard, no light gun.

## Build

`game.js` is the single built file: the `src/NN-*.js` modules are concatenated in name order into one IIFE, then
checked against the official restrictions.

- **Never edit `game.js` by hand.** It is generated from `src/`.
- **Mangling:** top-level names inside the IIFE are mangled, but string contents and object property names are not.
- **`//` in strings:** the restriction checker rejects any `//<alnum>`, even inside base64. The build escapes long base64 literals, and comments must use `// ` with a space.
- **Accented text:** written with `String.raw` tagged templates (`R\`...\``), so the minifier keeps raw UTF-8.

| Module | Role | Minified |
|---|---|---|
| `00-input.js` | `CABINET_KEYS` (cabinet wiring — never change), `btn/hit/clearHits`, `store` (arcade bridge → localStorage → memory) | ~1.4 KB |
| `10-assets.js` | `ASSETS`: low-res palette PNG data URIs | ~10.6 KB |
| `20-nn.js` | `nnUp(img)` / `nnCore(rgba,w,h)`: neural 4x depixelizer | ~3.4 KB |
| `30-audio.js` | `AU.init(ctx) / play(name) / music(n)`: procedural Web Audio | ~2.3 KB |
| `40-story.js` | `STORY`: branching dialogue, mods, endings, cross-run world memory | ~9.1 KB |
| `50-game.js` | Phaser scene: title, hero select, rail shooter, dialogue UI, HUD, continue, names, leaderboard | ~24.5 KB |

## Premise and lore (author-approved)

- **The invaders are LOS PRIMEROS.** Never call them "Arrivals"; that is the franchise name.
- **Canon** (the author's Arrivals site):
  - 2052: phenomena and radiation, then 8 years of world war.
  - A non-human ship is found buried in South America. In this game that is **Roraima**, the Venezuelan tepuy (author decision, 2026-10-09; the original site says Machu Picchu). The broadcast "El enemigo está aquí: 5.143333°, -60.762500°" unites the planet.
  - Every computer on Earth works for 2 years to break the ship's quantum encryption, **QSHA-1024**. Breaking it reveals that the radiation turned Earth into a beacon calling *los primeros*.
  - Los Primeros are several races who were here before and left their weapons *en suspensión*. They call Earth *el paraíso* and demand "¡Fuera!".
  - A countdown bar stands at 90%. A ship with a shield against everything keeps coming.
- **Qawakun** is the AI agent born from the effort to break QSHA-1024. The radiation blinds the soldiers' visors, and Qawakun reconstructs the image with its neural net; that is the x4 upscaler.
  - **SEÑAL** is your link to Qawakun. Hits degrade it and the world pixelates.
  - **QAWAKUN OVERDRIVE** is a full-compute pulse.
  - Qawakun keeps mission logs of every crew. That is the persistent world memory.
- **Cast:**
  - **Fornax:** general of the South American resistance, medium range.
  - **Sumer:** North American secret agent, superhuman, short range. Not a healer.
  - **Lukxed:** ex-European lieutenant, sniper.
  - **Phelios:** mercenary from the *dimensión zero*. His skin colour changes with his combat mode, and he hates the Luphomoids.
  - **Phaenon:** Kleper robot, in it for the loot, bribable.
  - **Vidnah:** Kleper, *la restauradora*.
- **Language:** neutral Spanish, no regional slang. Light humour comes from the characters.
- **Art:** only from the author's Arrivals projects, or drawn in code. Enemies are only los Primeros and their army, never humans.

## Game

**Controls** (arcade codes): joystick aims, B1 fires (hold for auto), B2 reloads, B3 QAWAKUN OVERDRIVE, B4 lock target, B6 toggles IA x4 on/off. START1/START2 start the game or join mid-game.

**Heroes** (picked at start; in 2P each player picks a different one). Canon weapon classes come from the author's site.

| Hero | Weapon | Behaviour | Rounds | Fire | Reload |
|---|---|---|---|---|---|
| Fornax | KEEPER X9 · Nuclear | Guided missile, area blast, homes on the lock | 6 | 0.35 s | 1.3 s |
| Sumer | SIC KLE-A · Pólvora | Auto burst, ×2 damage up close, overheats | 18 | 0.09 s | 1.0 s |
| Lukxed | RAILGUN SR · Pólvora | Piercing beam, ×2 damage on weak points | 4 | 0.6 s | 1.6 s |

**Levels.** The script is data-driven (`LV` in 50-game.js): `M` walk, `W` waves of pop-ups from cover, `B` story beat, `X` boss.
1. **Centro de Caracas.** A procedural avenue: facades, cars and motorbikes, El Ávila, the shielded ship. Boss: the mothership, with 3 pods.
2. **Metro de Caracas.** Línea 1 style: red-orange cab, a white train with the yellow-blue-red stripe, rails on blue sleepers, a yellow safety line. Boss: an ancient guardian that fires volleys; its eye opens only in a short window after each volley.
3. **Roraima.** `bg3` is a painted pixel-art summit generated by code: a rocky platform with the sea of clouds below on both sides, distant tepuys and the Kukenán with a waterfall. **Final boss: always Phaenon**, with high-cadence green bursts, artillery zones and shield phases. Story `mods.ph`: 1 = Phelios fights for the crew (a magenta beam at Phaenon), 2 = Phelios is a second boss beside him (vulnerable only in green; red = Void Claw volley; violet = blink). Vidnah heals the bosses with an interruptible beam unless she is your ally, in which case she heals the team. Defeated bosses fall off the platform into the clouds.

**Co-op roles:** boss fights are built for one player defending (shooting volleys and artillery down, interrupting Vidnah) while the other deals damage. Solo play gets smaller volleys and slower healing. In 2P the hint "P1 DEFIENDE · P2 ATACA" appears. In co-op, P1 alone picks the dialogue choices.

**VS mode "HUMANOS vs PRIMEROS"** (2P; B3 on hero select toggles CO-OP / VS):
- **Factions:** P1 is the resistance (Fornax, Sumer, Lukxed). P2 is los Primeros: Phelios · VOID CLAW, Vidnah · BIO SPORE, Phaenon · NEOCRUSH, reusing the three weapon behaviours.
- **Waves:** mixed. Aliens attack P1 and armed militia attack P2. Hitting your own side costs 300 points.
- **Lives:** 3 each. The rally runs through the three levels until someone loses all three. There is no story in VS.
- **Bosses:** two per level, the alien boss for P1 and a hologram of Fornax, Sumer or Lukxed for P2.
- **Ending:** the winner screen ("GANA LA RESISTENCIA" / "GANAN LOS PRIMEROS"), then name entry.

**Enemies** (table `ET`):
- drone: figure-8 flight, dives
- trooper: strafes, ducks behind cover, shoots
- vandal (alien raider): zig-zag rush
- purun (guardian): slow stomp, eye ×3
- cloaked trooper: revealed by Vidnah
- civilian: shooting one costs SEÑAL
- militia (VS only): an armed, tinted civilian that attacks P2
Every attack is telegraphed by a red ring.

**Systems:**
- **SEÑAL ladder:** at 3, slight pixelate; at 2, strong; at 1 or below, raw low-res textures.
- **Cooldowns:** per-weapon fire interval and reload, Sumer heat, Overdrive with 2 charges per run and a 25 s cooldown, a lock-cycle gate.
- **Scoring:** a kill pays `round(base × 2 / (1 + ln(1 + t)))`, where t is the seconds the enemy was on screen (×2 for an instant kill, ~×0.84 at 3 s), then the combo multiplier up to x8. Continue is HotD-style (the score resets, the board keeps your best).
- **Persistence:** top 5 in `qn-scores`, world memory in `qn-world`.

## Module contracts

- **`ASSETS`:**
  - portraits, 40×48 opaque: `fornax sumer phaenon vidnah qawakun phelios lukxed`
  - sprites, alpha 0/255: `drone trooper vandal purun civ boss ship car moto`
  - backdrop: `bg3`
  - The game creates `key+'_hd'` with `nnUp` and `key+'_bc'` (bilinear) for the B6 toggle.
- **`nnUp(img)`** returns a 4x canvas. **`nnCore(rgba,w,h)`** returns `{data,w,h}`.
  - Shipped version: an RGBA blend-weight CNN that depixelizes.
- **`AU`:**
  - `init(ctx)` must never throw.
  - `play(name)` names: shot empty reload hit kill hurt civ bomb beep talk boss win lose start heal glitch.
  - `music(n)`: one Andean theme. 0 is the slow title version, 1–4 add drums at a rising tempo (4 = boss), `null` stops.
- **`STORY`** (pure, deterministic, garbage-safe):
  - `newRun(world, players, heroes)`
  - `beat(run, id)` / `choose(run, id, i)` return `{lines:[{who,name,text}], choices:[...]}`
  - `mods(run, level)` returns `{route, ally, sniper, boss, hard, extra, ph}`. `boss` is always `'phaenon'`. `ph`: 0 = before l3a, 1 = Phelios ally, 2 = Phelios second boss.
  - `ending(run)` returns `{id, title, lines}`
  - `commit(world, run, name, score)` returns the new world
  - Beats: intro (≤6 lines), l1a, l1b, l2a, l2b, l3a, l3b, end. Endings: luz, adios, silencio, vidnah (secret, community-unlocked).
  - A played hero never appears as an NPC or ally.

## Palette
- Background: `#1A0E26`
- Accents:
  - lime `#D9F21B` (P1)
  - magenta `#FF4FD8` (P2)
  - teal `#50F2C4`
  - purple `#822BD9`
  - yellow `#F2E205`
  - gold `#F8C20B`
