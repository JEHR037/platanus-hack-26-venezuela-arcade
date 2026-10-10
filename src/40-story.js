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
