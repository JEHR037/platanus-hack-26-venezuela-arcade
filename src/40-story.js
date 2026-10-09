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
