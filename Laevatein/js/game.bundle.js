(() => {
  // js/core/state-machine.js
  var StateMachine = class {
    constructor(initialState, transitions) {
      this.value = initialState;
      this.transitions = transitions;
    }
    transition(nextState) {
      if (nextState === this.value) return this.value;
      const allowed = this.transitions[this.value] || [];
      if (!allowed.includes(nextState)) {
        throw new Error(`Transi\xE7\xE3o inv\xE1lida: ${this.value} -> ${nextState}`);
      }
      this.value = nextState;
      return this.value;
    }
    reset(nextState) {
      if (!Object.hasOwn(this.transitions, nextState)) {
        throw new Error(`Estado desconhecido: ${nextState}`);
      }
      this.value = nextState;
      return this.value;
    }
  };
  var AppState = new StateMachine("MENU", {
    MENU: ["PLAYING"],
    PLAYING: ["PAUSED", "GAME_OVER", "MENU"],
    PAUSED: ["PLAYING", "MENU"],
    GAME_OVER: ["PLAYING", "MENU"]
  });

  // js/core/asset-loader.js
  var AssetLoader = class {
    static async loadImages(manifest) {
      const entries = Object.entries(manifest);
      const results = await Promise.all(entries.map(([name, src]) => new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve([name, image]);
        image.onerror = () => {
          console.error(`N\xE3o foi poss\xEDvel carregar a imagem "${src}" (${name}).`);
          resolve([name, image]);
        };
        image.src = src;
      })));
      return Object.fromEntries(results);
    }
    static loadAudio(src) {
      const audio = new Audio();
      audio.preload = "auto";
      audio.src = src;
      audio.load();
      return audio;
    }
  };

  // js/core/assets.js
  var Assets = (() => {
    const lista = {
      a_run0: "assets/images/player/a_run0.png",
      a_run1: "assets/images/player/a_run1.png",
      a_run2: "assets/images/player/a_run2.png",
      a_run3: "assets/images/player/a_run3.png",
      a_run4: "assets/images/player/a_run4.png",
      a_run5: "assets/images/player/a_run5.png",
      a_run6: "assets/images/player/a_run6.png",
      a_run7: "assets/images/player/a_run7.png",
      a_idle: "assets/images/player/a_idle.png",
      a_jump: "assets/images/player/a_jump.png",
      a_fall: "assets/images/player/a_fall.png",
      a_hurt: "assets/images/player/a_hurt.png",
      a_tiro: "assets/images/player/a_tiro.png",
      emergenciaChao: "assets/images/environment/boss-emergence-ground.png",
      hidra: "assets/images/boss/hidra.png",
      marte: "assets/images/backgrounds/marte.png",
      chao: "assets/images/environment/chao.png",
      p1: "assets/images/backgrounds/p1.png",
      p2: "assets/images/backgrounds/p2.png",
      worm: "assets/images/enemies/worm.png",
      alien: "assets/images/enemies/alien.png",
      cacadorPlasma: "assets/images/enemies/cacador-plasma.png",
      chefe: "assets/images/boss/chefe.png",
      nave: "assets/images/environment/nave.png"
    };
    Object.assign(lista, {
      cenarioFase1: "assets/images/backgrounds/cenario-fase1.png",
      cenarioFase1Jogo: "assets/images/backgrounds/background-jupiter-desert.png",
      cenarioFase2: "assets/images/backgrounds/cenario-fase2-saturno.png",
      cenarioFase3: "assets/images/backgrounds/cenario-fase3-gelo.png",
      guardiaoPlasma: "assets/images/enemies/guardiao-plasma.png",
      bruxaNucleo: "assets/images/boss/bruxa-nucleo.png",
      bruxaChefe: "assets/images/boss/bruxa-chefe.png"
    });
    lista.sentinelaChefe = "assets/images/boss/sentinela-base-chefe.png";
    lista.guardianRun = "assets/images/enemies/guardian-run-sheet.png";
    lista.devoradorEmergencia1 = "assets/images/boss/devorador-emergence-1.png";
    lista.devoradorEmergencia2 = "assets/images/boss/devorador-emergence-2.png";
    lista.devoradorEmergencia3 = "assets/images/boss/devorador-emergence-3.png";
    const img = {};
    const pronto = AssetLoader.loadImages(lista).then((loaded) => Object.assign(img, loaded));
    const ok = (i) => !!i && i.complete && i.naturalWidth > 0;
    const cacheSilhueta = /* @__PURE__ */ new Map();
    function silhueta(i) {
      if (!ok(i)) return null;
      if (cacheSilhueta.has(i)) return cacheSilhueta.get(i);
      const c = document.createElement("canvas");
      c.width = i.naturalWidth;
      c.height = i.naturalHeight;
      const x = c.getContext("2d");
      x.drawImage(i, 0, 0);
      x.globalCompositeOperation = "source-in";
      x.fillStyle = "#ffffff";
      x.fillRect(0, 0, c.width, c.height);
      cacheSilhueta.set(i, c);
      return c;
    }
    return { img, pronto, ok, silhueta };
  })();
  var Som = (() => {
    let ac = null;
    let mudo = false;
    let musica = null;
    let fadeTimer = null;
    const VOL_MUSICA = 0.55;
    try {
      mudo = localStorage.getItem("laevatein_mudo") === "1";
    } catch (e) {
    }
    function contexto() {
      if (!ac) {
        try {
          ac = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
          ac = null;
        }
      }
      if (ac && ac.state === "suspended") ac.resume();
      return ac;
    }
    function desbloquear() {
      contexto();
    }
    function tocar(src, { loop = true, vol = VOL_MUSICA } = {}) {
      parar();
      musica = AssetLoader.loadAudio(src);
      musica.loop = loop;
      musica.volume = mudo ? 0 : vol;
      musica._vol = vol;
      musica.play().catch(() => {
      });
    }
    function parar() {
      clearInterval(fadeTimer);
      if (musica) {
        musica.pause();
        musica = null;
      }
    }
    function fade(ms) {
      if (!musica) return;
      const m = musica;
      const v0 = m.volume;
      const t0 = performance.now();
      clearInterval(fadeTimer);
      fadeTimer = setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / ms);
        m.volume = v0 * (1 - k);
        if (k >= 1) {
          clearInterval(fadeTimer);
          m.pause();
        }
      }, 50);
    }
    function pausar() {
      if (musica) musica.pause();
    }
    function retomar() {
      if (musica && !mudo) musica.play().catch(() => {
      });
      else if (musica) musica.play().catch(() => {
      });
    }
    function alternarMudo() {
      mudo = !mudo;
      if (musica) musica.volume = mudo ? 0 : musica._vol;
      try {
        localStorage.setItem("laevatein_mudo", mudo ? "1" : "0");
      } catch (e) {
      }
      return mudo;
    }
    function tom(f0, f1, dur, tipo = "square", vol = 0.08, atraso = 0) {
      const a = contexto();
      if (!a || mudo) return;
      const t = a.currentTime + atraso;
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = tipo;
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(1e-4, t + dur);
      o.connect(g).connect(a.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    }
    function ruido(dur, vol = 0.15, freq = 1500) {
      const a = contexto();
      if (!a || mudo) return;
      const n = Math.floor(a.sampleRate * dur);
      const buf = a.createBuffer(1, n, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = a.createBufferSource();
      src.buffer = buf;
      const filtro = a.createBiquadFilter();
      filtro.type = "lowpass";
      filtro.frequency.value = freq;
      const g = a.createGain();
      g.gain.value = vol;
      src.connect(filtro).connect(g).connect(a.destination);
      src.start();
    }
    const efeitos = {
      tiro: () => {
        tom(980, 260, 0.09, "square", 0.05);
      },
      pulo: () => {
        tom(260, 620, 0.14, "sine", 0.09);
      },
      acerto: () => {
        tom(220, 110, 0.07, "triangle", 0.09);
      },
      morte: () => {
        ruido(0.28, 0.2, 1800);
        tom(300, 60, 0.25, "sawtooth", 0.07);
      },
      dano: () => {
        tom(340, 50, 0.4, "sawtooth", 0.12);
        ruido(0.3, 0.18, 900);
      },
      coletar: () => {
        tom(660, 660, 0.09, "square", 0.07);
        tom(990, 990, 0.14, "square", 0.07, 0.09);
      },
      orbe: () => {
        tom(170, 90, 0.25, "sine", 0.14);
      },
      alerta: () => {
        tom(440, 440, 0.25, "square", 0.07);
        tom(330, 330, 0.25, "square", 0.07, 0.3);
        tom(440, 440, 0.25, "square", 0.07, 0.6);
      },
      explosao: () => {
        ruido(0.6, 0.3, 700);
        tom(140, 30, 0.6, "sawtooth", 0.12);
      },
      contagem: () => {
        tom(520, 520, 0.12, "square", 0.07);
      },
      vai: () => {
        tom(780, 780, 0.35, "square", 0.08);
      },
      clique: () => {
        tom(600, 900, 0.05, "square", 0.05);
      },
      jato: () => {
        ruido(0.07, 0.05, 2600);
      }
    };
    function sfx(nome) {
      if (efeitos[nome]) efeitos[nome]();
    }
    return {
      desbloquear,
      tocar,
      parar,
      fade,
      pausar,
      retomar,
      alternarMudo,
      sfx,
      get mudo() {
        return mudo;
      }
    };
  })();

  // js/scenes/intro.js
  var Intro = (() => {
    const cv = document.getElementById("telaIntro");
    const c = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1;
    let raf = 0, rodando = false, ultimo = 0, tempo = 0;
    let estrelas = [], cometas = [], poeira = [];
    let cenarioMascarado = null;
    let nave = null, proximaNave = 5;
    let pulo = { ativo: false, t: 0, proximo: 4.5 };
    const rand = (a, b) => a + Math.random() * (b - a);
    function altChao() {
      return Math.max(90, H * 0.15);
    }
    function redimensionar() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      estrelas = [];
      const n = Math.round(W * H / 5e3);
      for (let i = 0; i < n; i++) {
        estrelas.push({
          x: Math.random() * W,
          y: Math.random() * H * 0.8,
          r: Math.random() * 1.4 + 0.3,
          v: Math.random() * 2 + 0.5,
          f: Math.random() * 6.28
        });
      }
      prepararMarte();
      cabine = null;
    }
    function prepararMarte() {
      const im = Assets.img.cenarioFase1;
      if (!Assets.ok(im)) {
        cenarioMascarado = null;
        return;
      }
      const esc = Math.max(W / im.naturalWidth, H * 0.78 / im.naturalHeight);
      const w = Math.ceil(im.naturalWidth * esc);
      const h = Math.ceil(im.naturalHeight * esc);
      const o = document.createElement("canvas");
      o.width = w;
      o.height = h;
      const x = o.getContext("2d");
      x.drawImage(im, 0, 0, w, h);
      x.globalCompositeOperation = "destination-in";
      const g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.3, "rgba(0,0,0,0)");
      g.addColorStop(0.58, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,1)");
      x.fillStyle = g;
      x.fillRect(0, 0, w, h);
      cenarioMascarado = { cv: o, w, h };
    }
    function desenharEspaco() {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#04060d");
      g.addColorStop(0.55, "#150c1c");
      g.addColorStop(1, "#3a1a14");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      for (const s of estrelas) {
        const a = 0.45 + 0.55 * Math.sin(tempo * s.v + s.f);
        c.globalAlpha = Math.max(0.1, a);
        c.fillStyle = "#fff";
        c.fillRect(s.x, s.y, s.r, s.r);
      }
      c.globalAlpha = 1;
      for (let i = cometas.length - 1; i >= 0; i--) {
        const m = cometas[i];
        m.x += m.vx;
        m.y += m.vy;
        m.vida -= 0.016;
        const grad = c.createLinearGradient(m.x, m.y, m.x - m.vx * 14, m.y - m.vy * 14);
        grad.addColorStop(0, `rgba(255,255,255,${Math.max(0, m.vida)})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        c.strokeStyle = grad;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(m.x, m.y);
        c.lineTo(m.x - m.vx * 14, m.y - m.vy * 14);
        c.stroke();
        if (m.vida <= 0) cometas.splice(i, 1);
      }
      if (Math.random() < 6e-3) {
        cometas.push({ x: rand(W * 0.2, W), y: rand(0, H * 0.3), vx: rand(-9, -6), vy: rand(2, 4), vida: 1 });
      }
    }
    function desenharPlaneta() {
      const r = Math.min(W, H) * 0.26;
      const cx = W * 0.8 + Math.sin(tempo * 0.1) * 4;
      const cy = H * 0.27;
      let g = c.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.45);
      g.addColorStop(0, "rgba(255,120,60,0.35)");
      g.addColorStop(1, "rgba(255,120,60,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(cx, cy, r * 1.45, 0, 6.2832);
      c.fill();
      g = c.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
      g.addColorStop(0, "#f09a64");
      g.addColorStop(0.55, "#c4552d");
      g.addColorStop(1, "#5a1d10");
      c.fillStyle = g;
      c.beginPath();
      c.arc(cx, cy, r, 0, 6.2832);
      c.fill();
      c.save();
      c.beginPath();
      c.arc(cx, cy, r, 0, 6.2832);
      c.clip();
      const marcas = [[-0.35, 0.1, 0.22], [0.25, -0.3, 0.16], [0.35, 0.35, 0.2], [-0.1, -0.5, 0.12], [-0.5, -0.35, 0.1], [0.05, 0.55, 0.14]];
      for (const [mx, my, mr] of marcas) {
        c.fillStyle = "rgba(90,30,16,0.35)";
        c.beginPath();
        c.arc(cx + mx * r, cy + my * r, mr * r, 0, 6.2832);
        c.fill();
        c.strokeStyle = "rgba(255,190,140,0.18)";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(cx + mx * r - 2, cy + my * r - 2, mr * r, 3.6, 5.5);
        c.stroke();
      }
      c.fillStyle = "rgba(255,240,230,0.55)";
      c.beginPath();
      c.ellipse(cx - r * 0.1, cy - r * 0.97, r * 0.35, r * 0.1, 0, 0, 6.2832);
      c.fill();
      g = c.createRadialGradient(cx - r * 0.5, cy - r * 0.5, r * 0.7, cx + r * 0.2, cy + r * 0.2, r * 1.5);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,10,0.45)");
      c.fillStyle = g;
      c.fillRect(cx - r, cy - r, r * 2, r * 2);
      c.restore();
      const ang = tempo * 0.12;
      const lx = cx + Math.cos(ang) * r * 1.7;
      const ly = cy + Math.sin(ang) * r * 0.5 - r * 0.2;
      c.fillStyle = "#9a9a9a";
      c.beginPath();
      c.arc(lx, ly, r * 0.1, 0, 6.2832);
      c.fill();
      c.fillStyle = "rgba(0,0,0,0.35)";
      c.beginPath();
      c.arc(lx + r * 0.03, ly + r * 0.03, r * 0.1, 0, 6.2832);
      c.fill();
    }
    function desenharPaisagem() {
      if (!cenarioMascarado) return;
      const { cv: o, w, h } = cenarioMascarado;
      const desloc = tempo * 26 % (w * 2);
      const y = H - h;
      for (let i = -1; i < Math.ceil(W / w) + 2; i++) {
        const x = Math.round(i * w - desloc);
        const k = (i % 2 + 2) % 2;
        c.save();
        if (k === 1) {
          c.translate(x + w, y);
          c.scale(-1, 1);
          c.drawImage(o, 0, 0);
        } else {
          c.translate(x, y);
          c.drawImage(o, 0, 0);
        }
        c.restore();
      }
    }
    function desenharChao() {
      const ag = altChao();
      const y = H - ag;
      const im = Assets.img.chao;
      if (Assets.ok(im)) {
        c.imageSmoothingEnabled = false;
        const t = Math.ceil(ag);
        const desloc = tempo * 240 % t;
        for (let x = -desloc; x < W; x += t) c.drawImage(im, x, y, t, ag);
        c.imageSmoothingEnabled = true;
        c.globalCompositeOperation = "multiply";
        c.fillStyle = "rgba(200,95,50,0.55)";
        c.fillRect(0, y, W, ag);
        c.globalCompositeOperation = "source-over";
      } else {
        c.fillStyle = "#a04a22";
        c.fillRect(0, y, W, ag);
      }
      const g = c.createLinearGradient(0, y, 0, H);
      g.addColorStop(0, "rgba(0,0,0,0.0)");
      g.addColorStop(1, "rgba(10,0,0,0.65)");
      c.fillStyle = g;
      c.fillRect(0, y, W, ag);
      c.fillStyle = "rgba(20,6,2,0.9)";
      c.fillRect(0, y - 3, W, 4);
    }
    function atualizarNave(dt) {
      proximaNave -= dt;
      if (!nave && proximaNave <= 0) {
        nave = { x: -340, y: H * rand(0.1, 0.22), v: rand(110, 150) };
      }
      if (!nave) return;
      nave.x += nave.v * dt;
      const im = Assets.img.nave;
      const w = Math.min(300, W * 0.24);
      const h = Assets.ok(im) ? w * im.naturalHeight / im.naturalWidth : w * 0.5;
      const y = nave.y + Math.sin(tempo * 2) * 6;
      for (let i = 0; i < 2; i++) {
        poeira.push({ x: nave.x + 6, y: y + h * 0.45 + rand(-8, 8), vx: rand(-90, -40), vy: rand(-8, 8), vida: 0.5, max: 0.5, r: rand(3, 6), cor: "255,160,60" });
      }
      if (Assets.ok(im)) c.drawImage(im, nave.x, y, w, h);
      if (nave.x > W + 50) {
        nave = null;
        proximaNave = rand(12, 18);
      }
    }
    function desenharAstronauta(dt) {
      const ag = altChao();
      const chaoY = H - ag + ag * 0.22;
      const alt = Math.max(120, Math.min(210, H * 0.22));
      const alvoX = Math.max(W * 0.22, 120);
      const entrada = Math.min(1, tempo / 3.2);
      const ease = 1 - Math.pow(1 - entrada, 3);
      const x = -120 + (alvoX + 120) * ease;
      const chegou = entrada >= 1;
      let dy = 0;
      if (chegou) {
        pulo.proximo -= dt;
        if (!pulo.ativo && pulo.proximo <= 0) {
          pulo.ativo = true;
          pulo.t = 0;
        }
        if (pulo.ativo) {
          pulo.t += dt;
          const d = 0.75;
          const k = pulo.t / d;
          dy = -Math.sin(Math.min(1, k) * Math.PI) * alt * 0.55;
          if (k >= 1) {
            pulo.ativo = false;
            pulo.proximo = rand(3.5, 6);
          }
        }
      }
      const im = Assets.img[pulo.ativo ? "a_jump" : "a_run" + Math.floor(tempo / 0.07) % 8];
      const bob = pulo.ativo ? 0 : Math.abs(Math.sin(tempo * 11)) * -5;
      const sc = 1 - Math.min(0.5, -dy / (alt * 1.2));
      c.fillStyle = "rgba(0,0,0,0.35)";
      c.beginPath();
      c.ellipse(x, chaoY + 4, alt * 0.26 * sc, alt * 0.05 * sc, 0, 0, 6.2832);
      c.fill();
      if (Assets.ok(im)) {
        const w = alt * im.naturalWidth / im.naturalHeight;
        c.drawImage(im, x - w / 2, chaoY - alt + dy + bob, w, alt);
      }
      if (!pulo.ativo && Math.random() < 0.5) {
        poeira.push({ x: x - alt * 0.2, y: chaoY, vx: rand(-90, -40), vy: rand(-40, -10), vida: 0.6, max: 0.6, r: rand(3, 7), cor: "210,120,70" });
      }
    }
    function desenharPoeira(dt) {
      for (let i = poeira.length - 1; i >= 0; i--) {
        const p = poeira[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vida -= dt;
        if (p.vida <= 0) {
          poeira.splice(i, 1);
          continue;
        }
        c.globalAlpha = p.vida / p.max * 0.6;
        c.fillStyle = `rgb(${p.cor})`;
        c.beginPath();
        c.arc(p.x, p.y, p.r * (1.3 - p.vida / p.max * 0.5), 0, 6.2832);
        c.fill();
      }
      c.globalAlpha = 1;
      if (poeira.length > 300) poeira.splice(0, poeira.length - 300);
    }
    function vinheta() {
      const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.6)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    let modo = "warp", warpV = 4, tSaida = -1, cabine = null;
    const CORES = ["255,255,255", "170,215,255", "255,200,140", "255,160,200"];
    const NEB = ["255,170,60", "90,200,255", "255,120,170", "150,90,255", "60,220,200"];
    const REDUZ = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sNova = (ini) => ({ x: rand(-1, 1), y: rand(-1, 1), z: ini ? rand(0.04, 1) : 1, c: CORES[Math.random() * 4 | 0] });
    const bNova = (ini) => ({ x: rand(-1.4, 1.4), y: rand(-1.2, 1.2), z: ini ? rand(0.1, 1) : 1, r: rand(0.08, 0.22), c: NEB[Math.random() * 5 | 0] });
    const ws = Array.from({ length: 300 }, () => sNova(true));
    const wb = Array.from({ length: 16 }, () => bNova(true));
    function desenharWarp(dt) {
      if (tSaida >= 0) {
        tSaida += dt;
        warpV = 1 + 8 * Math.pow(Math.min(1, tSaida / 0.8), 2);
      } else warpV += ((REDUZ ? 0.4 : 1) - warpV) * Math.min(1, dt * 1.2);
      const cx = W / 2, cy = H * 0.38, k = Math.max(W, H) * 0.19;
      const sh = REDUZ ? 0 : Math.min(2.5, warpV * 0.8);
      c.save();
      c.translate(rand(-sh, sh), rand(-sh, sh));
      let g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#02030a");
      g.addColorStop(1, "#0a0720");
      c.fillStyle = g;
      c.fillRect(-5, -5, W + 10, H + 10);
      c.globalCompositeOperation = "lighter";
      for (let i = 0; i < 4; i++) {
        const a = tempo * 0.15 + i * 1.7, nx = cx + Math.cos(a) * W * 0.25, ny = cy + Math.sin(a * 1.3) * H * 0.18;
        g = c.createRadialGradient(nx, ny, 0, nx, ny, W * 0.35);
        g.addColorStop(0, "rgba(" + NEB[(i * 2 + 1) % 5] + ",0.16)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
      }
      for (const b of wb) {
        b.z -= dt * 0.55 * warpV;
        if (b.z < 0.08) {
          Object.assign(b, bNova(false));
          continue;
        }
        const sx = cx + b.x / b.z * k, sy = cy + b.y / b.z * k, r = b.r / b.z * k * 0.7;
        if (sx < -r || sx > W + r || sy < -r || sy > H + r) {
          if (b.z < 0.4) Object.assign(b, bNova(false));
          continue;
        }
        g = c.createRadialGradient(sx, sy, 0, sx, sy, r);
        const al = Math.min(0.55, (1 - b.z) * 0.9);
        g.addColorStop(0, "rgba(" + b.c + "," + al + ")");
        g.addColorStop(1, "rgba(" + b.c + ",0)");
        c.fillStyle = g;
        c.beginPath();
        c.arc(sx, sy, r, 0, 6.2832);
        c.fill();
      }
      c.lineCap = "round";
      for (const s of ws) {
        s.z -= dt * 0.9 * warpV;
        if (s.z < 0.03) {
          Object.assign(s, sNova(false));
          continue;
        }
        const pz = Math.min(1.5, s.z + 0.02 + 0.035 * warpV);
        c.strokeStyle = "rgba(" + s.c + "," + Math.min(1, (1 - s.z) * 1.4) + ")";
        c.lineWidth = 0.6 + (1 - s.z) * 2.2;
        c.beginPath();
        c.moveTo(cx + s.x / pz * k, cy + s.y / pz * k);
        c.lineTo(cx + s.x / s.z * k, cy + s.y / s.z * k);
        c.stroke();
      }
      c.globalCompositeOperation = "source-over";
      c.restore();
      if (tSaida > 0.5) {
        c.fillStyle = "rgba(255,255,255," + Math.min(1, (tSaida - 0.5) / 0.4) + ")";
        c.fillRect(0, 0, W, H);
      }
    }
    function montarCabine() {
      const o = document.createElement("canvas");
      o.width = cv.width;
      o.height = cv.height;
      const x = o.getContext("2d");
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!x.roundRect) x.roundRect = function(a, b, w, h) {
        this.rect(a, b, w, h);
      };
      const j = { x: W * 0.05, y: H * 0.07, w: W * 0.9, h: H * 0.62, r: Math.min(W, H) * 0.07 };
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#0d1118");
      g.addColorStop(1, "#1b2231");
      x.fillStyle = g;
      x.beginPath();
      x.rect(0, 0, W, H);
      x.roundRect(j.x, j.y, j.w, j.h, j.r);
      x.fill("evenodd");
      x.lineWidth = 5;
      x.strokeStyle = "#46546d";
      x.beginPath();
      x.roundRect(j.x, j.y, j.w, j.h, j.r);
      x.stroke();
      x.lineWidth = 2;
      x.strokeStyle = "#000";
      x.beginPath();
      x.roundRect(j.x + 5, j.y + 5, j.w - 10, j.h - 10, j.r);
      x.stroke();
      x.fillStyle = "#0a0d13";
      x.lineWidth = 3;
      x.strokeStyle = "#46546d";
      for (const sd of [-1, 1]) {
        const bx = sd < 0 ? j.x : j.x + j.w;
        x.beginPath();
        x.moveTo(bx, j.y);
        x.lineTo(bx - sd * W * 0.17, j.y);
        x.lineTo(bx, j.y + H * 0.24);
        x.closePath();
        x.fill();
        x.stroke();
      }
      x.save();
      x.beginPath();
      x.roundRect(j.x, j.y, j.w, j.h, j.r);
      x.clip();
      const r = x.createLinearGradient(j.x, j.y, j.x + j.w * 0.5, j.y + j.h);
      r.addColorStop(0, "rgba(255,255,255,0.07)");
      r.addColorStop(0.35, "rgba(255,255,255,0)");
      x.fillStyle = r;
      x.fillRect(j.x, j.y, j.w, j.h);
      x.restore();
      const py = j.y + j.h, ph = Math.max(20, H - py - 56);
      x.fillStyle = "#05070b";
      x.fillRect(0, py + 8, W, 3);
      x.fillStyle = "#2a3446";
      for (let px = 30; px < W; px += 46) {
        x.beginPath();
        x.arc(px, py + 22, 2.5, 0, 6.2832);
        x.fill();
      }
      for (const ax of [W * 0.07, W * 0.69]) {
        x.fillStyle = "#04080e";
        x.strokeStyle = "#46546d";
        x.lineWidth = 3;
        x.beginPath();
        x.roundRect(ax, py + 40, W * 0.24, ph, 8);
        x.fill();
        x.stroke();
      }
      return { cv: o, py };
    }
    function desenharCabine() {
      if (!cabine) cabine = montarCabine();
      c.drawImage(cabine.cv, 0, 0, W, H);
      const py = cabine.py, ph = Math.max(20, H - py - 56), fs = Math.max(8, Math.min(15, W * 0.011));
      const lx = W * 0.07, rx = W * 0.69, aw = W * 0.24, ty = py + 40;
      for (let i = 0; i < 14; i++) {
        const h = (0.25 + 0.75 * Math.abs(Math.sin(tempo * 3 + i * 0.9))) * ph * 0.7 * Math.min(1, warpV / 3 + 0.35);
        c.fillStyle = i > 10 ? "#ff8d8d" : "#5eead4";
        c.fillRect(lx + 12 + i * (aw - 24) / 14, ty + ph - 8 - h, (aw - 24) / 14 - 3, h);
      }
      const rcx = rx + aw / 2, rcy = ty + ph / 2, rr = Math.min(aw, ph) * 0.42;
      c.strokeStyle = "rgba(94,234,212,0.5)";
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(rcx, rcy, rr, 0, 6.2832);
      c.moveTo(rcx - rr, rcy);
      c.lineTo(rcx + rr, rcy);
      c.moveTo(rcx, rcy - rr);
      c.lineTo(rcx, rcy + rr);
      c.stroke();
      c.beginPath();
      c.arc(rcx, rcy, rr * 0.5, 0, 6.2832);
      c.stroke();
      const a = tempo * 2.4;
      c.strokeStyle = "#5eead4";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(rcx, rcy);
      c.lineTo(rcx + Math.cos(a) * rr, rcy + Math.sin(a) * rr);
      c.stroke();
      c.fillStyle = "#ffd166";
      c.fillRect(rcx + Math.cos(tempo * 0.7) * rr * 0.6, rcy + Math.sin(tempo * 0.9) * rr * 0.5, 4, 4);
      c.textAlign = "center";
      c.font = fs + 'px "Press Start 2P", monospace';
      c.fillStyle = "#8793a0";
      c.fillText("VELOCIDADE", W / 2, ty + fs * 1.6);
      c.font = fs * 2 + 'px "Press Start 2P", monospace';
      c.fillStyle = "#ffffff";
      c.fillText((0.62 + warpV * 0.09).toFixed(2) + " c", W / 2, ty + fs * 4.6);
      for (let i = -1; i <= 1; i++) {
        c.fillStyle = Math.sin(tempo * 4 + i * 2) > 0 ? "#e0284d" : "#3a1118";
        c.beginPath();
        c.arc(W / 2 + i * 36, ty + ph - 14, 5, 0, 6.2832);
        c.fill();
      }
      c.textAlign = "left";
    }
    function quadro(agora) {
      if (!rodando) return;
      const dt = Math.min(0.05, (agora - ultimo) / 1e3);
      ultimo = agora;
      tempo += dt;
      if (!cenarioMascarado && Assets.ok(Assets.img.cenarioFase1)) prepararMarte();
      if (modo === "warp") {
        desenharWarp(dt);
        desenharCabine();
      } else {
        desenharEspaco();
        desenharPlaneta();
        desenharPaisagem();
        atualizarNave(dt);
        desenharChao();
        desenharAstronauta(dt);
        desenharPoeira(dt);
      }
      vinheta();
      raf = requestAnimationFrame(quadro);
    }
    function iniciar() {
      if (rodando) return;
      rodando = true;
      cv.style.display = "block";
      redimensionar();
      ultimo = performance.now();
      raf = requestAnimationFrame(quadro);
    }
    function parar() {
      rodando = false;
      cancelAnimationFrame(raf);
      cv.style.display = "none";
    }
    window.addEventListener("resize", () => {
      if (rodando) redimensionar();
    });
    return { iniciar, parar, saida() {
      tSaida = 0;
    }, reiniciarEntrada() {
      tempo = 0;
      tSaida = -1;
      warpV = 4;
      pulo = { ativo: false, t: 0, proximo: 4.5 };
    } };
  })();

  // js/core/input-handler.js
  var GAME_KEYS = /* @__PURE__ */ new Set([
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Space",
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "KeyZ",
    "KeyJ",
    "KeyK",
    "KeyE",
    "ShiftLeft",
    "ShiftRight"
  ]);
  var InputHandler = class {
    constructor(target = window) {
      this.target = target;
      this.keys = /* @__PURE__ */ Object.create(null);
      this.enabled = () => false;
      this.actions = {};
      this.target.addEventListener("keydown", (event) => this.handleKeyDown(event));
      this.target.addEventListener("keyup", (event) => {
        this.keys[event.code] = false;
      });
      this.target.addEventListener("blur", () => {
        this.clear();
        this.actions.onBlur?.();
      });
    }
    attach({ enabled, ...actions }) {
      this.enabled = enabled;
      this.actions = actions;
    }
    clear() {
      for (const key of Object.keys(this.keys)) this.keys[key] = false;
    }
    handleKeyDown(event) {
      if (!this.enabled()) return;
      if (GAME_KEYS.has(event.code)) event.preventDefault();
      if (event.code === "KeyM") {
        this.actions.onMute?.();
        return;
      }
      if (event.code === "KeyP" || event.code === "Escape") {
        this.actions.onPause?.();
        return;
      }
      if (event.code === "KeyE") {
        this.actions.onInteract?.();
        return;
      }
      if ((event.code === "Enter" || event.code === "NumpadEnter") && this.actions.onConfirm?.()) return;
      if (event.code === "KeyR" && this.actions.onRestart?.()) return;
      if (!event.repeat && (event.code === "ArrowUp" || event.code === "KeyW")) this.actions.onJump?.();
      this.keys[event.code] = true;
    }
  };

  // js/entities/enemy-movement.js
  var EnemyMovement = class {
    static update(enemy, player, groundY) {
      enemy.direction = -1;
      const variation = 1 + Math.sin(enemy.fase * 2.4) * 0.08;
      enemy.x += enemy.direction * enemy.vel * variation;
      if (enemy.baseY !== void 0) {
        const hover = Math.sin(enemy.fase * 1.4) * (enemy.amp || 14);
        const targetY = Math.max(groundY - enemy.h - 250, Math.min(groundY - enemy.h - 12, player.y + hover));
        enemy.y += (targetY - enemy.y) * 0.025;
      } else {
        enemy.y = groundY - enemy.h;
      }
    }
  };

  // js/entities/ship.js
  var Ship = class {
    constructor({ x, y, targetY, width, height }) {
      this.x = x;
      this.y = y;
      this.targetY = targetY;
      this.w = width;
      this.h = height;
      this.estado = "descendo";
      this.vx = 0;
      this.vy = 0;
    }
    get bounds() {
      return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
    get exitDoor() {
      return {
        x: this.x + this.w * 0.68,
        y: this.y + this.h * 0.34,
        w: this.w * 0.25,
        h: this.h * 0.62
      };
    }
    canBoard(playerBounds) {
      const door = this.exitDoor;
      const centerX = playerBounds.x + playerBounds.w / 2;
      const centerY = playerBounds.y + playerBounds.h * 0.55;
      return centerX >= door.x && centerX <= door.x + door.w && centerY >= door.y && centerY <= door.y + door.h;
    }
  };

  // js/scenes/level-manager.js
  var LEVELS = Object.freeze([
    Object.freeze({
      name: "BASE ESPACIAL",
      background: "cenarioFase1Jogo",
      enemyTypes: Object.freeze(["alien", "guardiao"]),
      boss: Object.freeze({ name: "SENTINELA DA BASE", role: "sentinel", sprite: "sentinelaChefe", scale: 0.9, hue: 0 }),
      kills: 8,
      maxEnemies: 4,
      spawnMin: 105,
      spawnMax: 145,
      bossHp: 18,
      bossRest: 36,
      attackWarning: 20,
      projectileSpeed: 5.4,
      chargeSpeed: 10,
      keyInterval: 145
    }),
    Object.freeze({
      name: "VALE DE PLASMA",
      background: "cenarioFase2",
      enemyTypes: Object.freeze(["bruxa", "cacadorPlasma"]),
      boss: Object.freeze({ name: "BRUXA DO N\xDACLEO", role: "witch", sprite: "bruxaChefe", scale: 1.08, hue: 0 }),
      kills: 9,
      maxEnemies: 5,
      spawnMin: 90,
      spawnMax: 125,
      bossHp: 34,
      bossRest: 48,
      attackWarning: 24,
      projectileSpeed: 6.6,
      chargeSpeed: 12,
      keyInterval: 155
    }),
    Object.freeze({
      name: "N\xDACLEO DO REATOR",
      background: "cenarioFase3",
      enemyTypes: Object.freeze(["worm", "devorador"]),
      boss: Object.freeze({
        name: "MINHOCA DO N\xDACLEO",
        role: "worm",
        sprite: "worm",
        scale: 1.04,
        hue: 0,
        forms: Object.freeze([
          Object.freeze({ sprite: "worm", at: 1, widthScale: 1.5, heightScale: 0.68 }),
          Object.freeze({ sprite: "chefe", at: 0.66, widthScale: 1.4, heightScale: 1.4 }),
          Object.freeze({ sprite: "hidra", at: 0.33, widthScale: 1.9, heightScale: 1.55 })
        ])
      }),
      kills: 10,
      maxEnemies: 5,
      spawnMin: 82,
      spawnMax: 112,
      bossHp: 52,
      bossRest: 42,
      attackWarning: 22,
      projectileSpeed: 7.3,
      chargeSpeed: 13.5,
      keyInterval: 165
    })
  ]);
  var LevelManager = class {
    static get(index) {
      const level = LEVELS[index];
      if (!level) throw new RangeError(`Fase inv\xE1lida: ${index + 1}`);
      return level;
    }
    static background(index) {
      return this.get(index).background;
    }
  };

  // js/utils/sprite-animator.js
  var SpriteAnimator = class {
    static draw(ctx, image, frame, x, y, width, height, frameWidth, frameHeight, columns) {
      if (!image || !image.complete || !image.naturalWidth) return false;
      const totalFrames = Math.floor(image.naturalWidth / frameWidth) * Math.floor(image.naturalHeight / frameHeight);
      if (!totalFrames) return false;
      const index = (Math.floor(frame) % totalFrames + totalFrames) % totalFrames;
      const sourceX = index % columns * frameWidth;
      const sourceY = Math.floor(index / columns) * frameHeight;
      ctx.drawImage(image, sourceX, sourceY, frameWidth, frameHeight, x, y, width, height);
      return true;
    }
  };

  // js/scenes/game.js
  (() => {
    const LW = 1280, LH = 720;
    const ALT_CHAO = 96;
    const CHAO_Y = LH - ALT_CHAO;
    let META_KILLS = 8;
    const VIDAS_INI = 3, VIDAS_MAX = 5;
    const GRAVIDADE = 0.55, FORCA_PULO = -13.5;
    const VEL_JOGADOR = 4.4;
    const PASSO = 1e3 / 60;
    const GRAV = [0.7, 1, 0.9];
    const NOMES = [0, 1, 2].map((indice) => LevelManager.get(indice).name);
    const BIOMA = [{ tom: "rgba(25,45,110,0.55)", chao: "rgba(110,130,190,0.6)" }, { tom: "rgba(30,150,90,0.32)", chao: "rgba(90,190,120,0.6)" }, { tom: "rgba(150,20,30,0.42)", chao: "rgba(210,70,50,0.6)" }];
    const CONFIG_FASE = [0, 1, 2].map((indice) => {
      const nivel2 = LevelManager.get(indice);
      return {
        abates: nivel2.kills,
        maxInimigos: nivel2.maxEnemies,
        spawnMin: nivel2.spawnMin,
        spawnMax: nivel2.spawnMax,
        hpChefe: nivel2.bossHp,
        pausaChefe: nivel2.bossRest,
        avisoAtaque: nivel2.attackWarning,
        velocidadeOrbe: nivel2.projectileSpeed,
        velocidadeInvestida: nivel2.chargeSpeed,
        intervaloChave: nivel2.keyInterval
      };
    });
    const FONTE = '"Press Start 2P", "Courier New", monospace';
    const PI2 = Math.PI * 2;
    const canvas = document.getElementById("telaGame");
    const ctx = canvas.getContext("2d");
    const painel = document.getElementById("painel");
    const img = Assets.img;
    let rodando = false, estado = "parado", estadoAntesPausa = "jogando";
    let raf = 0, ultimo = 0, acumulador = 0, escala = 1;
    const input = new InputHandler();
    const teclas = input.keys;
    let t, J, inimigos, tiros, orbes, itens, particulas, textos, plataformas;
    let camX, velScroll, kills, pontos, cadeia, comboTimer, melhorCombo, derrotados;
    let fase, spawnTimer, chefe, nave, tremor, hitstop, flashDano, flashBranco;
    let nivel = 0, chaves = 0, chaveTimer = 0, bannerFase = 0;
    let contagem, timerFase, alertaChefe, quadrosJogo, acaoEnter, pulsoCoracao, pulsoPontos;
    let recorde = lerRecorde2();
    let novoRecorde = false;
    function lerRecorde2() {
      try {
        return parseInt(localStorage.getItem("laevatein_recorde"), 10) || 0;
      } catch (e) {
        return 0;
      }
    }
    function salvarRecorde(v) {
      try {
        localStorage.setItem("laevatein_recorde", String(v));
      } catch (e) {
      }
    }
    const rand = (a, b) => a + Math.random() * (b - a);
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    function acompanharJogador() {
      if (J.morto || estado === "embarcando" || nave || estado === "chefeMorrendo" && nivel === 2 || chefe && chefe.vivo) return;
      const limite = LW * 0.58;
      if (J.x <= limite) return;
      const deslocamento = J.x - limite;
      J.x = limite;
      camX += deslocamento;
      for (const e of inimigos) e.x -= deslocamento;
      for (const it of itens) it.x -= deslocamento;
      for (const p of plataformas) p.x -= deslocamento;
      for (const s of tiros) s.x -= deslocamento;
      for (const o of orbes) o.x -= deslocamento;
      for (const p of particulas) p.x -= deslocamento;
      for (const x of textos) x.x -= deslocamento;
    }
    function manterPlataformas() {
      while (plataformas[plataformas.length - 1].x < LW + 300) {
        const anterior = plataformas[plataformas.length - 1];
        const p = {
          x: anterior.x + anterior.w + rand(210, 300),
          y: clamp(anterior.y + rand(-75, 75), CHAO_Y - 210, CHAO_Y - 92),
          w: rand(135, 185),
          h: 18
        };
        plataformas.push(p);
      }
      plataformas = plataformas.filter((p) => p.x + p.w > -40);
    }
    function ajustarTela() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const s = Math.min(window.innerWidth / LW, window.innerHeight / LH);
      canvas.style.width = LW * s + "px";
      canvas.style.height = LH * s + "px";
      canvas.width = Math.round(LW * s * dpr);
      canvas.height = Math.round(LH * s * dpr);
      escala = canvas.width / LW;
    }
    window.addEventListener("resize", ajustarTela);
    function resetar() {
      t = 0;
      J = {
        x: 220,
        y: CHAO_Y - 96,
        w: 57,
        h: 96,
        vy: 0,
        noChao: true,
        direcao: 1,
        pousoAnterior: CHAO_Y,
        vidas: VIDAS_INI,
        invul: 0,
        recarga: 0,
        coyote: 0,
        bufPulo: 0,
        pulando: false,
        anim: 0,
        morto: false,
        alpha: 1,
        visivel: true,
        rot: 0,
        correndo: true,
        vx: 0,
        comb: 100
      };
      inimigos = [];
      tiros = [];
      orbes = [];
      itens = [];
      particulas = [];
      textos = [];
      plataformas = [
        { x: 760, y: CHAO_Y - 128, w: 175, h: 18 },
        { x: 1370, y: CHAO_Y - 176, w: 160, h: 18 }
      ];
      camX = 0;
      velScroll = 5;
      kills = 0;
      pontos = 0;
      cadeia = 0;
      comboTimer = 0;
      melhorCombo = 0;
      derrotados = 0;
      fase = "corrida";
      spawnTimer = 60;
      chefe = null;
      nave = null;
      nivel = 0;
      META_KILLS = CONFIG_FASE[0].abates;
      chaves = 0;
      chaveTimer = 100;
      bannerFase = 190;
      tremor = 0;
      hitstop = 0;
      flashDano = 0;
      flashBranco = 0;
      contagem = 0;
      timerFase = 0;
      alertaChefe = 0;
      quadrosJogo = 0;
      acaoEnter = null;
      pulsoCoracao = [];
      pulsoPontos = 0;
      novoRecorde = false;
      painel.classList.add("oculto");
      painel.innerHTML = "";
    }
    function iniciar() {
      ajustarTela();
      resetar();
      AppState.transition("PLAYING");
      estado = "contagem";
      contagem = 0;
      rodando = true;
      recorde = lerRecorde2();
      Som.tocar("assets/audio/lostEmotion.mp3", { loop: true });
      if (document.fonts && document.fonts.load) document.fonts.load('16px "Press Start 2P"').catch(() => {
      });
      ultimo = performance.now();
      acumulador = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    }
    function reiniciar() {
      resetar();
      AppState.transition("PLAYING");
      estado = "contagem";
      Som.tocar("assets/audio/lostEmotion.mp3", { loop: true });
    }
    function parar() {
      rodando = false;
      AppState.reset("MENU");
      cancelAnimationFrame(raf);
      estado = "parado";
      painel.classList.add("oculto");
    }
    function mostrarPainel(classeTitulo, titulo, linhas, botoes, dica) {
      let html = `<h2 class="${classeTitulo}">${titulo}</h2>`;
      if (linhas && linhas.length) {
        html += '<div class="linhas">' + linhas.map(
          (l) => l.novo ? `<div class="novo">${l.novo}</div>` : `<div class="linha ${l.classe || ""}"><span>${l[0]}</span><span>${l[1]}</span></div>`
        ).join("") + "</div>";
      }
      html += '<div class="botoes"></div>';
      if (dica) html += `<div class="dica">${dica}</div>`;
      painel.innerHTML = html;
      const area = painel.querySelector(".botoes");
      botoes.forEach((b, i) => {
        const el = document.createElement("button");
        el.textContent = b.txt;
        if (i === 0) el.className = "primario";
        el.addEventListener("click", () => {
          Som.sfx("clique");
          b.fn();
        });
        area.appendChild(el);
      });
      acaoEnter = botoes[0].fn;
      painel.classList.remove("oculto");
      area.firstChild.focus({ preventScroll: true });
    }
    function esconderPainel() {
      painel.classList.add("oculto");
      painel.innerHTML = "";
      acaoEnter = null;
    }
    const fmt = (n) => String(Math.max(0, Math.floor(n))).padStart(7, "0");
    const esq = () => teclas.ArrowLeft || teclas.KeyA || pad.esq;
    const dir = () => teclas.ArrowRight || teclas.KeyD || pad.dir;
    const cima = () => teclas.ArrowUp || teclas.KeyW || pad.pulo;
    const atira = () => teclas.Space || teclas.KeyZ || teclas.KeyJ || teclas.KeyK || pad.tiro;
    function alternarPausa() {
      if (estado === "pausado") {
        AppState.transition("PLAYING");
        estado = estadoAntesPausa;
        esconderPainel();
        Som.retomar();
        ultimo = performance.now();
      } else if (estado === "jogando" || estado === "contagem" || estado === "chefeMorrendo" || estado === "desfecho") {
        AppState.transition("PAUSED");
        estadoAntesPausa = estado;
        estado = "pausado";
        Som.pausar();
        mostrarPainel("pausa", "PAUSADO", null, [
          { txt: "Continuar", fn: alternarPausa },
          { txt: "Reiniciar", fn: reiniciar },
          { txt: "Menu", fn: () => {
            esconderPainel();
            window.voltarAoMenu();
          } }
        ], "P / ESC continua &nbsp;\xB7&nbsp; M liga/desliga o som");
      }
    }
    const sobrepoe = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const caixaJ = () => ({ x: J.x + 13, y: J.y + 10, w: J.w - 26, h: J.h - 12 });
    function caixaE(e) {
      if (e.tipo === "chefe") return { x: e.x + 40, y: e.y + 34, w: e.w - 80, h: e.h - 34 };
      if (e.tipo === "worm") return { x: e.x + 10, y: e.y + 8, w: e.w - 20, h: e.h - 8 };
      return { x: e.x + 12, y: e.y + 10, w: e.w - 24, h: e.h - 20 };
    }
    function circuloRetangulo(cx, cy, r, b) {
      const px = clamp(cx, b.x, b.x + b.w);
      const py = clamp(cy, b.y, b.y + b.h);
      return Math.hypot(cx - px, cy - py) <= r;
    }
    function burst(x, y, n, cores, vel = 5, vida = 40, tam = 4) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * PI2, v = rand(1, vel);
        particulas.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 1,
          vida: rand(vida * 0.5, vida),
          max: vida,
          r: rand(tam * 0.5, tam),
          cor: cores[Math.random() * cores.length | 0],
          g: 0.12
        });
      }
      if (particulas.length > 500) particulas.splice(0, particulas.length - 500);
    }
    function texto(x, y, str, cor = "#fff", tam = 14) {
      textos.push({ x, y, str, cor, tam, vida: 55, max: 55 });
    }
    function ganharPontos(base, x, y) {
      const mult = multiplicador();
      const total = base * mult;
      pontos += total;
      pulsoPontos = 12;
      if (x !== void 0) texto(x, y, "+" + total + (mult > 1 ? " x" + mult : ""), mult > 1 ? "#ffd166" : "#fff");
    }
    const multiplicador = () => Math.min(4, 1 + Math.floor(cadeia / 3));
    function danoJogador() {
      if (J.invul > 0 || J.morto) return;
      J.vidas--;
      pulsoCoracao[J.vidas] = 22;
      cadeia = 0;
      comboTimer = 0;
      tremor = 16;
      flashDano = 34;
      Som.sfx("dano");
      burst(J.x + J.w / 2, J.y + J.h / 2, 18, ["#ffffff", "#cbd5e1", "#e0284d"], 6, 38, 4);
      if (J.vidas <= 0) {
        morrer();
        return;
      }
      J.invul = 110;
      J.vy = -8;
      J.noChao = false;
      hitstop = 5;
    }
    function morrer() {
      J.morto = true;
      J.vy = -11;
      estado = "morrendo";
      timerFase = 0;
      Som.fade(1200);
      burst(J.x + J.w / 2, J.y + J.h / 2, 40, ["#ffffff", "#cbd5e1", "#e0284d", "#ff8d8d"], 8, 55, 5);
    }
    function finalizarDerrota() {
      AppState.transition("GAME_OVER");
      estado = "fim";
      const novo = pontos > recorde;
      if (novo) {
        recorde = pontos;
        salvarRecorde(pontos);
      }
      mostrarPainel("derrota", "FIM DE JOGO", [
        ["Pontos", fmt(pontos)],
        ["Inimigos derrotados", derrotados],
        ["Melhor combo", "x" + Math.max(1, Math.min(4, 1 + Math.floor(melhorCombo / 3))) + " (" + melhorCombo + " seguidos)"],
        ["Recorde", fmt(recorde)],
        ...novo && pontos > 0 ? [{ novo: "\u2605 NOVO RECORDE! \u2605" }] : []
      ], [
        { txt: "Tentar de novo", fn: reiniciar },
        { txt: "Menu", fn: () => {
          esconderPainel();
          window.voltarAoMenu();
        } }
      ], "ENTER ou R para tentar de novo");
    }
    function dispararTiro() {
      J.recarga = 11;
      J.tiroAnim = 9;
      const direcao = J.direcao || 1;
      tiros.push({ x: J.x + (direcao > 0 ? J.w + 20 : -20), y: J.y + 42, vx: 17 * direcao });
      Som.sfx("tiro");
      burst(J.x + (direcao > 0 ? J.w + 22 : -22), J.y + 42, 3, ["#7dd3fc", "#ffffff"], 2.5, 10, 3);
    }
    function spawnar() {
      const { enemyTypes } = LevelManager.get(nivel);
      const tipo = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      const x = LW + 60;
      if (tipo === "worm") {
        inimigos.push({
          tipo,
          tinta: "hue-rotate(245deg) saturate(1.5)",
          x,
          y: CHAO_Y - 62,
          w: 146,
          h: 62,
          hp: 4,
          hpMax: 4,
          vel: 2.5,
          fase: rand(0, 6),
          flash: 0,
          vivo: true,
          pts: 260
        });
      } else if (tipo === "devorador") {
        inimigos.push({
          tipo,
          x,
          y: CHAO_Y - 112,
          w: 138,
          h: 112,
          hp: 4,
          hpMax: 4,
          vel: 2.1,
          fase: rand(0, 6),
          flash: 0,
          vivo: true,
          pts: 320
        });
      } else if (tipo === "guardiao") {
        inimigos.push({
          tipo,
          tinta: "saturate(1.75) brightness(1.45) contrast(1.12) hue-rotate(35deg)",
          x,
          y: CHAO_Y - 96,
          w: 82,
          h: 96,
          hp: 2,
          hpMax: 2,
          vel: 3.1,
          fase: rand(0, 6),
          flash: 0,
          vivo: true,
          pts: 240
        });
      } else if (tipo === "bruxa") {
        const base = CHAO_Y - (Math.random() < 0.5 ? 220 : 112);
        inimigos.push({
          tipo,
          x,
          y: base,
          baseY: base,
          w: 92,
          h: 105,
          hp: 2,
          hpMax: 2,
          vel: 3.4,
          fase: rand(0, 6),
          amp: 28,
          flash: 0,
          vivo: true,
          pts: 280
        });
      } else {
        const cacaPlasma = tipo === "cacadorPlasma";
        const voador = cacaPlasma || Math.random() < 0.4;
        const base = CHAO_Y - (voador ? Math.random() < 0.5 ? 210 : 105 : 60);
        inimigos.push({
          tipo: "alien",
          sprite: cacaPlasma ? "cacadorPlasma" : "alien",
          tinta: cacaPlasma ? "saturate(1.8) brightness(1.3) hue-rotate(75deg)" : "",
          x,
          y: base,
          ...voador ? { baseY: base } : {},
          w: cacaPlasma ? 88 : 72,
          h: cacaPlasma ? 98 : 60,
          hp: nivel === 2 ? 3 : 2,
          hpMax: nivel === 2 ? 3 : 2,
          vel: cacaPlasma ? 3.6 : 3.4,
          fase: rand(0, 6),
          amp: 24,
          flash: 0,
          vivo: true,
          pts: cacaPlasma ? 220 : 180
        });
      }
    }
    function iniciarChefe() {
      fase = "chefe";
      inimigos = inimigos.filter((e) => e.x < LW - 20);
      spawnTimer = 9999;
      const CH = LevelManager.get(nivel).boss;
      const forma = CH.forms && CH.forms[0];
      const escalaLargura = forma && forma.widthScale || 1;
      const escalaAltura = forma && forma.heightScale || 1;
      const hh = 222 * CH.scale * escalaAltura;
      const largura = 230 * CH.scale * escalaLargura;
      const baseY = CHAO_Y - hh + (CH.role === "worm" ? -8 : 14);
      const emerge = CH.role === "worm";
      chefe = {
        tipo: "chefe",
        x: LW - largura - 45,
        y: emerge ? CHAO_Y + 42 : baseY + (CH.role === "witch" ? 100 : 0),
        baseY,
        w: largura,
        h: hh,
        hp: CONFIG_FASE[nivel].hpChefe,
        hpMax: CONFIG_FASE[nivel].hpChefe,
        ia: emerge ? "emergindo" : "entrando",
        ti: 0,
        ciclo: 0,
        fase2: false,
        formIndex: 0,
        config: CH,
        role: CH.role,
        flash: 0,
        vivo: true,
        jx: 0,
        nome: CH.name,
        hue: CH.hue,
        sprite: forma ? forma.sprite : CH.sprite,
        rajada: [],
        ataqueDisparado: false
      };
      if (!emerge) chefe.x = LW + 80;
      inimigos.push(chefe);
      alertaChefe = 170;
      tremor = 10;
      Som.sfx("alerta");
      if (nivel === 2) Som.tocar("assets/audio/youkaiGirl.mp3", { loop: true });
    }
    function cuspir(b, tipo) {
      Som.sfx(tipo === "espada" ? "acerto" : "orbe");
      const x = tipo === "espada" ? b.x - 12 : b.x + 52;
      const cor = tipo === "espada" ? "#dce8f0" : b.role === "witch" ? "#c084fc" : b.role === "worm" ? "#a3e635" : "#7dd3fc";
      const velocidade = CONFIG_FASE[nivel].velocidadeOrbe * (b.fase2 ? 1.08 : 1);
      let y, vx = -velocidade, vy = 0, raio = 16;
      if (tipo === "espada") {
        y = clamp(J.y + J.h / 2, CHAO_Y - 300, CHAO_Y - 22);
        vx = -Math.max(10, velocidade * 1.35);
        raio = 24;
      } else if (tipo === "alto") {
        y = b.y + 92;
      } else if (tipo === "baixo") {
        y = CHAO_Y - 20;
        raio = 19;
      } else {
        y = b.y + b.h * 0.43;
        const dx = J.x + J.w / 2 - x, dy = J.y + J.h / 2 - y;
        const distancia = Math.max(1, Math.hypot(dx, dy));
        vx = dx / distancia * velocidade;
        vy = dy / distancia * velocidade;
      }
      orbes.push({ x, y, r: raio, vx, vy, tipo, cor, fase: 0 });
      b.ultimoAtaque = tipo;
    }
    function mudarFormaChefe(b, indice) {
      const forma = b.config.forms[indice];
      const escalaLargura = forma.widthScale || 1;
      const escalaAltura = forma.heightScale || 1;
      b.formIndex = indice;
      b.sprite = forma.sprite;
      b.w = 230 * b.config.scale * escalaLargura;
      b.h = 222 * b.config.scale * escalaAltura;
      b.baseY = CHAO_Y - b.h - 8;
      b.x = LW - b.w - 45;
      b.y = b.baseY;
      b.ia = "espera";
      b.ti = 0;
      b.fase2 = indice > 0;
      b.ataqueDisparado = false;
      b.jx = 0;
      b.rajada.length = 0;
      tremor = 18;
      flashBranco = 16;
      burst(b.x + b.w / 2, b.y + b.h * 0.8, 34, ["#7bd13f", "#b7f060", "#ffffff"], 8, 42, 7);
      Som.sfx("explosao");
      texto(LW / 2, 170, "FORMA " + (indice + 1) + "!", "#c8ff6b", 20);
    }
    function chefeIA(b) {
      const baseX = LW - b.w - 45;
      b.ti++;
      for (let i = b.rajada.length - 1; i >= 0; i--) {
        if (--b.rajada[i].t <= 0) {
          cuspir(b, b.rajada[i].tipo);
          b.rajada.splice(i, 1);
        }
      }
      b.jx = 0;
      if (b.role === "worm" && b.config.forms) {
        const proporcaoVida = b.hp / b.hpMax;
        let proximaForma = 0;
        for (let i = 1; i < b.config.forms.length; i++) {
          if (proporcaoVida <= b.config.forms[i].at) proximaForma = i;
        }
        if (proximaForma > b.formIndex) {
          mudarFormaChefe(b, proximaForma);
          return;
        }
      }
      if (b.hp <= b.hpMax / 2 && !b.fase2) {
        b.fase2 = true;
        tremor = 12;
        flashBranco = 12;
        burst(b.x + b.w / 2, b.y + b.h / 2, 30, ["#7bd13f", "#b7f060", "#ffffff"], 8, 40, 6);
        Som.sfx("alerta");
        texto(LW / 2, 170, "F\xDARIA!", "#ff5a5a", 22);
      }
      switch (b.ia) {
        case "emergindo": {
          const k = Math.min(1, b.ti / 170), alvoY = b.baseY;
          const kk = clamp((k - 0.5) / 0.5, 0, 1);
          b.y = CHAO_Y + 40 + (alvoY - CHAO_Y - 40) * (1 - Math.pow(1 - kk, 2));
          b.jx = Math.sin(b.ti * 1.7) * 4 * (1 - k);
          tremor = Math.max(tremor, 7 + 6 * (1 - k));
          if (b.ti % 4 === 0) burst(b.x + rand(0, b.w), CHAO_Y, 6, ["#d9773f", "#8a4a2a", "#f3b07a", "#4a2a1a"], 6, 34, 7);
          if (b.ti === 1) {
            Som.sfx("explosao");
            texto(LW / 2, 200, "O CH\xC3O TREME...", "#ffd1d1", 18);
          }
          if (k >= 1) {
            b.ia = "espera";
            b.ti = 0;
            flashBranco = 10;
            tremor = 14;
            Som.sfx("alerta");
          }
          break;
        }
        case "entrando":
          b.x -= 3.6;
          if (b.role === "witch") {
            b.y = b.baseY + Math.max(0, 100 - b.ti * 1.5) + Math.sin(b.ti * 0.08) * 8;
          }
          if (b.x <= baseX) {
            b.x = baseX;
            b.ia = "espera";
            b.ti = 0;
          }
          break;
        case "espera":
          b.x = baseX + Math.sin(b.ti * 0.045) * 54;
          b.y = b.baseY + Math.sin(b.ti * (b.role === "witch" ? 0.085 : 0.065)) * (b.role === "witch" ? 24 : 12);
          if (b.ti > CONFIG_FASE[nivel].pausaChefe - (b.fase2 ? 10 : 0)) {
            if (b.role === "sentinel") {
              b.ia = b.ciclo % 2 === 0 ? "espada" : "investida";
            } else if (b.role === "witch") {
              b.ia = b.ciclo % 3 === 2 ? "investida" : "cuspir";
            } else {
              b.ia = b.ciclo % (b.formIndex > 0 ? 2 : 3) === 2 ? "investida" : "cuspir";
            }
            b.ciclo++;
            b.ti = 0;
            b.volume = 0;
            b.ataqueDisparado = false;
          }
          break;
        case "espada": {
          const aviso = CONFIG_FASE[nivel].avisoAtaque;
          b.y = b.baseY + Math.sin(b.ti * 0.06) * 8;
          if (b.ti < aviso) b.jx = Math.sin(b.ti * 1.5) * 4;
          else if (b.ti <= aviso + 8) b.jx = -Math.sin((b.ti - aviso) / 8 * Math.PI) * 18;
          if (b.ti >= aviso && !b.ataqueDisparado) {
            b.ataqueDisparado = true;
            cuspir(b, "espada");
          }
          if (b.ti > 52) {
            b.ia = "espera";
            b.ti = 0;
          }
          break;
        }
        case "cuspir": {
          const aviso = CONFIG_FASE[nivel].avisoAtaque;
          b.y = b.baseY + Math.sin(b.ti * (b.role === "witch" ? 0.11 : 0.08)) * (b.role === "witch" ? 26 : 16);
          if (b.ti < aviso) b.jx = Math.sin(b.ti * 1.4) * 3;
          if (b.ti >= aviso && !b.ataqueDisparado) {
            b.ataqueDisparado = true;
            const tipo = b.role === "witch" || b.role === "worm" && b.formIndex > 0 ? "alvo" : Math.random() < 0.5 ? "alto" : "baixo";
            cuspir(b, tipo);
            if (b.role !== "sentinel" && (b.role === "witch" || b.fase2)) {
              const alternativo = tipo === "alto" ? "baixo" : "alto";
              b.rajada.push({ t: b.role === "witch" ? 24 : 28, tipo: alternativo });
            }
          }
          if (b.ti > 58) {
            b.ia = "espera";
            b.ti = 0;
          }
          break;
        }
        case "investida":
          b.y = b.baseY + Math.sin(b.ti * 0.09) * 10;
          if (b.ti < 42) {
            b.jx = Math.sin(b.ti * 1.6) * 4;
            b.x += 0.9;
          } else {
            b.x -= CONFIG_FASE[nivel].velocidadeInvestida;
            if (b.x <= baseX - 330) {
              b.ia = "voltando";
              b.ti = 0;
              tremor = 6;
            }
          }
          break;
        case "voltando":
          b.x += 4.2;
          if (b.x >= baseX) {
            b.x = baseX;
            b.ia = "espera";
            b.ti = 0;
          }
          break;
      }
    }
    function matarInimigo(e) {
      e.vivo = false;
      const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
      Som.sfx("morte");
      if (e.tipo === "chefe") {
        iniciarMorteChefe(e);
        return;
      }
      derrotados++;
      hitstop = Math.max(hitstop, 2);
      kills++;
      cadeia++;
      comboTimer = 170;
      melhorCombo = Math.max(melhorCombo, cadeia);
      ganharPontos(e.pts, cx, e.y - 6);
      burst(cx, cy, 22, e.tipo === "worm" ? ["#4a6b2a", "#7bd13f", "#b7f060", "#2d3b1c"] : ["#7bd13f", "#b7f060", "#e8ffa0", "#3a7a28"], 5.5, 36, 5);
      if (Math.random() < 0.14) {
        itens.push({ tipo: "coracao", x: cx - 14, y: cy - 14, vy: -5, w: 28, h: 28, fase: 0 });
      }
    }
    function proximaFase() {
      nivel++;
      META_KILLS = CONFIG_FASE[nivel].abates;
      kills = 0;
      chaves = 0;
      chaveTimer = 90;
      spawnTimer = 80;
      fase = "corrida";
      estado = "jogando";
      chefe = null;
      inimigos = [];
      tiros = [];
      orbes = [];
      bannerFase = 190;
      camX = 0;
      velScroll = 0;
      J.x = 220;
      J.y = CHAO_Y - J.h;
      J.vx = 0;
      J.vy = 0;
      J.noChao = true;
      plataformas = [
        { x: 760, y: CHAO_Y - 128, w: 175, h: 18 },
        { x: 1370, y: CHAO_Y - 176, w: 160, h: 18 }
      ];
      itens = itens.filter((it) => it.tipo === "coracao");
      J.invul = 120;
      flashBranco = 14;
      Som.sfx("coletar");
      if (J.vidas < VIDAS_MAX) {
        pulsoCoracao[J.vidas] = 22;
        J.vidas++;
      }
      Som.tocar("assets/audio/lostEmotion.mp3", { loop: true });
    }
    function iniciarMorteChefe(b) {
      fase = "chefeMorrendo";
      estado = "chefeMorrendo";
      timerFase = 0;
      orbes.forEach((o) => burst(o.x, o.y, 8, ["#7bd13f", "#b7f060"], 4, 25, 4));
      orbes = [];
      J.invul = 99999;
      ganharPontos(2500, b.x + b.w / 2, b.y - 10);
      derrotados++;
      tremor = 30;
      flashBranco = 20;
      hitstop = 10;
      Som.sfx("explosao");
      Som.fade(3e3);
    }
    function atualizarJogador() {
      if (estado === "embarcando") {
        J.vx = 0;
        J.vy = 0;
        J.bufPulo = 0;
        J.pulando = false;
        J.jato = false;
        J.correndo = false;
        return;
      }
      const vivo = !J.morto;
      let dx = 0;
      if (vivo && estado !== "embarcando" && estado !== "decolando") dx = (dir() ? 1 : 0) - (esq() ? 1 : 0);
      const turbo = teclas.ShiftLeft || teclas.ShiftRight;
      const alvoVx = dx * (VEL_JOGADOR + 2.2) * (turbo ? 1.25 : 1);
      J.vx += (alvoVx - J.vx) * (dx ? J.noChao ? 0.2 : 0.12 : J.noChao ? 0.16 : 0.045);
      if (dx) J.direcao = dx;
      J.x += J.vx;
      const minX = 50;
      let maxX = LW * 0.82;
      if (chefe && chefe.vivo) maxX = Math.min(LW - 470, chefe.x - J.w - 24);
      if (nave && !J.morto) maxX = LW - 90;
      if (vivo && estado !== "embarcando") {
        const c0 = J.x;
        J.x = clamp(J.x, minX, maxX);
        if (c0 !== J.x) J.vx = 0;
      }
      if (J.recarga > 0) J.recarga--;
      if (J.tiroAnim > 0) J.tiroAnim--;
      if (J.bufPulo > 0) J.bufPulo--;
      if (J.noChao) J.coyote = 6;
      else if (J.coyote > 0) J.coyote--;
      if (vivo && J.bufPulo > 0 && J.coyote > 0 && estado !== "embarcando") {
        J.vy = FORCA_PULO;
        J.noChao = false;
        J.coyote = 0;
        J.bufPulo = 0;
        J.pulando = true;
        Som.sfx("pulo");
        burst(J.x + J.w / 2, CHAO_Y, 6, ["#d9773f", "#f3b07a"], 2.5, 20, 4);
      }
      if (J.pulando && !cima() && J.vy < -5) J.vy = -5;
      if (J.vy >= 0) J.pulando = false;
      if (vivo && !J.noChao && !J.pulando && (cima() || turbo) && J.comb > 0 && estado !== "embarcando" && estado !== "decolando") {
        J.vy = Math.max(J.vy - 0.95, -6.5);
        J.comb -= 1.1;
        J.jato = true;
        if (t % 2 === 0) particulas.push({ x: J.x + 10, y: J.y + J.h - 20, vx: rand(-2, 0), vy: rand(2, 5), vida: 16, max: 16, r: rand(4, 8), cor: Math.random() < 0.5 ? "#ffb347" : "#ff6a3d", g: 0 });
        if (t % 6 === 0) Som.sfx("jato");
      } else J.jato = false;
      if (J.noChao) J.comb = Math.min(100, J.comb + 2.5);
      else if (!J.jato) J.comb = Math.min(100, J.comb + 0.15);
      J.vy = Math.min(J.vy + GRAVIDADE * GRAV[nivel], 16);
      J.pousoAnterior = J.y + J.h;
      J.y += J.vy;
      if (!J.morto) {
        J.noChao = false;
        if (J.vy >= 0) {
          for (const p of plataformas) {
            if (J.pousoAnterior <= p.y + 4 && J.y + J.h >= p.y && J.x + J.w - 8 > p.x && J.x + 8 < p.x + p.w) {
              J.y = p.y - J.h;
              J.vy = 0;
              J.noChao = true;
              break;
            }
          }
        }
        if (J.y + J.h >= CHAO_Y) {
          J.y = CHAO_Y - J.h;
          J.vy = 0;
          J.noChao = true;
        }
      } else {
        J.rot += 0.18;
      }
      acompanharJogador();
      if (J.invul > 0 && J.invul < 9e4) J.invul--;
      if (vivo && estado !== "embarcando" && estado !== "decolando" && atira() && J.recarga === 0 && estado !== "contagem") dispararTiro();
      J.correndo = Math.abs(J.vx) > 0.8;
      if (J.correndo && J.noChao) {
        J.anim += 0.14 * Math.max(0.35, Math.abs(J.vx) / 5);
        if (t % 5 === 0) particulas.push({ x: J.x + 8, y: J.y + J.h - 2, vx: J.vx > 0 ? -2 : 2, vy: rand(-1.2, -0.2), vida: 22, max: 22, r: rand(2, 4), cor: nivel === 2 ? "#c084fc" : nivel === 1 ? "#5eead4" : "#d9773f", g: 0 });
      }
    }
    function atualizarInimigos() {
      for (const e of inimigos) {
        if (!e.vivo) continue;
        if (e.flash > 0) e.flash--;
        e.fase += 0.07;
        if (e.tipo !== "chefe") {
          EnemyMovement.update(e, J, CHAO_Y);
        } else {
          chefeIA(e);
        }
      }
      inimigos = inimigos.filter((e) => e.vivo && e.x + e.w > -120);
    }
    function atualizarTiros() {
      for (let i = tiros.length - 1; i >= 0; i--) {
        const s = tiros[i];
        s.x += s.vx;
        let removido = false;
        for (let k = orbes.length - 1; k >= 0 && !removido; k--) {
          const o = orbes[k];
          if (Math.hypot(s.x - o.x, s.y - o.y) < o.r + 8) {
            burst(o.x, o.y, 10, ["#7bd13f", "#b7f060"], 4, 24, 4);
            orbes.splice(k, 1);
            ganharPontos(25, o.x, o.y - 10);
            Som.sfx("acerto");
            removido = true;
          }
        }
        if (!removido) {
          for (const e of inimigos) {
            if (!e.vivo) continue;
            if (e.tipo === "chefe" && (e.ia === "entrando" || e.ia === "emergindo")) continue;
            if (circuloRetangulo(s.x, s.y, 7, caixaE(e))) {
              e.hp--;
              e.flash = 4;
              Som.sfx("acerto");
              burst(s.x, s.y, 6, ["#ffffff", "#b7f060", "#7dd3fc"], 4, 18, 3);
              if (e.tipo === "chefe") {
                pontos += 10;
                pulsoPontos = 4;
                tremor = Math.max(tremor, 2);
              }
              if (e.hp <= 0) matarInimigo(e);
              removido = true;
              break;
            }
          }
        }
        if (removido || s.x > LW + 40 || s.x < -40) tiros.splice(i, 1);
      }
    }
    function atualizarOrbes() {
      for (let i = orbes.length - 1; i >= 0; i--) {
        const o = orbes[i];
        o.x += o.vx;
        o.y += o.vy || 0;
        o.fase += 0.2;
        if (o.tipo === "alto") o.y += Math.sin(o.fase) * 0.8;
        if (t % 3 === 0) particulas.push({ x: o.x + 8, y: o.y, vx: 0, vy: 0, vida: 14, max: 14, r: o.r * 0.5, cor: o.cor, g: 0 });
        if (!J.morto && J.invul <= 0 && circuloRetangulo(o.x, o.y, o.r * 0.85, caixaJ())) {
          burst(o.x, o.y, 12, [o.cor, "#ffffff"], 5, 24, 4);
          orbes.splice(i, 1);
          danoJogador();
          continue;
        }
        if (o.x < -40 || o.y < -50 || o.y > LH + 50) orbes.splice(i, 1);
      }
    }
    function atualizarItens() {
      for (let i = itens.length - 1; i >= 0; i--) {
        const it = itens[i];
        it.fase += 0.1;
        if (it.tipo === "chave") {
          if (!J.morto && sobrepoe(caixaJ(), { x: it.x - 8, y: it.y - 8, w: 44, h: 44 })) {
            chaves++;
            Som.sfx("coletar");
            ganharPontos(200, it.x, it.y - 10);
            texto(it.x, it.y - 30, "CHAVE " + chaves + "/3", "#ffd166", 12);
            burst(it.x + 14, it.y + 14, 14, ["#ffd166", "#fff2a8", "#ffffff"], 4, 26, 4);
            itens.splice(i, 1);
          } else if (it.x < -60) itens.splice(i, 1);
          continue;
        }
        it.vy += 0.3;
        it.y += it.vy;
        const chao = CHAO_Y - it.h - 6;
        if (it.y > chao) {
          it.y = chao;
          it.vy = -Math.abs(it.vy) * 0.45;
          if (Math.abs(it.vy) < 1.2) it.vy = 0;
        }
        if (!J.morto && sobrepoe(caixaJ(), { x: it.x - 6, y: it.y - 6, w: it.w + 12, h: it.h + 12 })) {
          if (J.vidas < VIDAS_MAX) {
            pulsoCoracao[J.vidas] = 22;
            J.vidas++;
            texto(it.x, it.y - 10, "+1 VIDA", "#ff8d8d", 12);
          } else {
            ganharPontos(300, it.x, it.y - 10);
          }
          Som.sfx("coletar");
          burst(it.x + 14, it.y + 14, 14, ["#ff8d8d", "#ffffff", "#ffd166"], 4, 26, 4);
          itens.splice(i, 1);
          continue;
        }
        if (it.x < -60) itens.splice(i, 1);
      }
    }
    function atualizarParticulas() {
      for (let i = particulas.length - 1; i >= 0; i--) {
        const p = particulas[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.g || 0;
        p.vida--;
        if (p.vida <= 0) particulas.splice(i, 1);
      }
      for (let i = textos.length - 1; i >= 0; i--) {
        const x = textos[i];
        x.y -= 0.7;
        x.vida--;
        if (x.vida <= 0) textos.splice(i, 1);
      }
    }
    function atualizarNave() {
      if (!nave) return;
      if (nave.estado === "descendo") {
        nave.y += Math.max(1.2, Math.min(9, (nave.targetY - nave.y) * 0.05));
        if (Math.random() < 0.6) particulas.push({ x: nave.x + 20, y: nave.y + nave.h * 0.5, vx: rand(-4, -1), vy: rand(-1, 1), vida: 20, max: 20, r: rand(3, 6), cor: "#ffb347", g: 0 });
        if (nave.targetY - nave.y < 1.5) {
          nave.y = nave.targetY;
          nave.estado = "pousada";
          tremor = 8;
          burst(nave.x + nave.w / 2, CHAO_Y, 24, ["#d9773f", "#f3b07a", "#fff"], 5, 36, 6);
        }
      } else if (nave.estado === "decolando") {
        nave.vx += 0.12;
        nave.vy -= 0.1;
        nave.x += nave.vx;
        nave.y += nave.vy;
        for (let i = 0; i < 3; i++) particulas.push({ x: nave.x + 20, y: nave.y + nave.h * 0.5 + rand(-10, 10), vx: rand(-7, -2), vy: rand(-1.5, 1.5), vida: 26, max: 26, r: rand(4, 9), cor: Math.random() < 0.5 ? "#ffb347" : "#ff6a3d", g: 0 });
        if (!J.visivel && (estado === "embarcando" || estado === "fim")) {
          const porta = nave.exitDoor;
          J.x = porta.x + porta.w / 2 - J.w / 2;
          J.y = porta.y + porta.h * 0.45 - J.h / 2;
          J.vx = 0;
          J.vy = 0;
        }
      }
    }
    function tentarEmbarcar() {
      if (estado !== "desfecho" || !nave || nave.estado !== "pousada" || !nave.canBoard(caixaJ())) return false;
      estado = "embarcando";
      timerFase = 0;
      J.alpha = 1;
      J.vx = 0;
      J.vy = 0;
      J.bufPulo = 0;
      J.pulando = false;
      J.jato = false;
      Som.sfx("clique");
      return true;
    }
    function iniciarVitoria() {
      AppState.transition("GAME_OVER");
      estado = "fim";
      Som.sfx("coletar");
      const bonusVidas = J.vidas * 500;
      const segundos = quadrosJogo / 60;
      const bonusTempo = Math.max(0, Math.round((4e3 - segundos * 20) / 10) * 10);
      const total = pontos + bonusVidas + bonusTempo;
      const novo = total > recorde;
      if (novo) {
        recorde = total;
        salvarRecorde(total);
      }
      const m = Math.floor(segundos / 60), s = Math.floor(segundos % 60);
      mostrarPainel("vitoria", "VIT\xD3RIA!", [
        ["Pontos", fmt(pontos)],
        ["B\xF4nus de vidas (" + J.vidas + " \u2665)", "+" + bonusVidas],
        ["B\xF4nus de tempo (" + m + ":" + String(s).padStart(2, "0") + ")", "+" + bonusTempo],
        ["Inimigos derrotados", derrotados],
        { 0: "TOTAL", 1: fmt(total), classe: "total" },
        ...novo ? [{ novo: "\u2605 NOVO RECORDE! \u2605" }] : [["Recorde", fmt(recorde)]]
      ], [
        { txt: "Jogar de novo", fn: reiniciar },
        { txt: "Menu", fn: () => {
          esconderPainel();
          window.voltarAoMenu();
        } }
      ], "Voc\xEA escapou de Marte!");
    }
    function passo() {
      t++;
      if (estado !== "contagem") quadrosJogo++;
      if (hitstop > 0) {
        hitstop--;
        return;
      }
      if (estado === "contagem") {
        const antes = Math.floor(contagem / 55);
        contagem++;
        const n = Math.floor(contagem / 55);
        if (n !== antes) Som.sfx(n >= 3 ? "vai" : "contagem");
        if (contagem === 1) Som.sfx("contagem");
        if (contagem >= 55 * 4) {
          estado = "jogando";
          contagem = 0;
        }
      }
      velScroll = 0;
      atualizarJogador();
      manterPlataformas();
      if (estado === "jogando" || estado === "chefeMorrendo" || estado === "desfecho" || estado === "embarcando") {
        if (fase === "corrida" && estado === "jogando") {
          if (kills >= META_KILLS && chaves >= 3) iniciarChefe();
          else if (--chaveTimer <= 0 && chaves + itens.filter((i) => i.tipo === "chave").length < 3) {
            itens.push({ tipo: "chave", x: LW + 40, y: CHAO_Y - rand(110, 250), w: 28, h: 28, fase: 0 });
            chaveTimer = CONFIG_FASE[nivel].intervaloChave;
          }
          spawnTimer--;
          if (spawnTimer <= 0 && inimigos.length < CONFIG_FASE[nivel].maxInimigos) {
            spawnar();
            spawnTimer = Math.round(rand(CONFIG_FASE[nivel].spawnMin, CONFIG_FASE[nivel].spawnMax) - Math.min(12, kills));
          }
        }
      }
      atualizarInimigos();
      atualizarTiros();
      atualizarOrbes();
      atualizarItens();
      atualizarParticulas();
      atualizarNave();
      if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer === 0) cadeia = 0;
      }
      if (tremor > 0) tremor *= 0.9;
      if (tremor < 0.3) tremor = 0;
      if (flashDano > 0) flashDano--;
      if (flashBranco > 0) flashBranco--;
      if (alertaChefe > 0) alertaChefe--;
      if (bannerFase > 0 && estado !== "contagem") bannerFase--;
      if (pulsoPontos > 0) pulsoPontos--;
      for (let i = 0; i < pulsoCoracao.length; i++) if (pulsoCoracao[i] > 0) pulsoCoracao[i]--;
      if (!J.morto && J.invul <= 0 && (estado === "jogando" || estado === "contagem")) {
        const cj = caixaJ();
        for (const e of inimigos) {
          if (!e.vivo || e.ia === "emergindo" || !sobrepoe(cj, caixaE(e))) continue;
          const ce = caixaE(e);
          if (e.tipo !== "chefe" && J.vy > 1 && J.pousoAnterior <= ce.y + 12) {
            e.hp--;
            e.flash = 8;
            J.vy = -9;
            J.noChao = false;
            J.invul = 12;
            Som.sfx("acerto");
            burst(J.x + J.w / 2, ce.y, 8, ["#ffffff", "#ffd166", "#7dd3fc"], 3, 18, 3);
            if (e.hp <= 0) matarInimigo(e);
            break;
          }
          danoJogador();
          break;
        }
      }
      if (estado === "morrendo") {
        timerFase++;
        if (timerFase > 100) finalizarDerrota();
      } else if (estado === "chefeMorrendo") {
        timerFase++;
        const b = chefe;
        if (timerFase % 5 === 0 && timerFase < 110) {
          const ex = b.x + rand(20, b.w - 20), ey = b.y + rand(20, b.h - 10);
          burst(ex, ey, 14, ["#ffb347", "#ff6a3d", "#fff2a8", "#7bd13f"], 6, 34, 6);
          tremor = Math.max(tremor, 8);
          if (timerFase % 10 === 0) Som.sfx("explosao");
        }
        if (timerFase === 110) {
          burst(b.x + b.w / 2, b.y + b.h / 2, 80, ["#ffb347", "#ff6a3d", "#fff2a8", "#7bd13f", "#4a6b2a"], 10, 60, 8);
          flashBranco = 18;
          tremor = 22;
          chefe = null;
          inimigos = inimigos.filter((e) => e.tipo !== "chefe");
        }
        if (timerFase === 190 && nivel < 2) {
          proximaFase();
        } else if (timerFase === 190) {
          fase = "desfecho";
          estado = "desfecho";
          nave = new Ship({ x: LW - 390, y: -260, targetY: CHAO_Y - 150, width: 300, height: 161 });
        }
      } else if (estado === "desfecho") {
        if (nave && nave.estado === "pousada" && nave.canBoard(caixaJ())) tentarEmbarcar();
      } else if (estado === "embarcando") {
        timerFase++;
        const alvo = nave.exitDoor.x + nave.exitDoor.w / 2 - J.w / 2;
        const alvoY = nave.exitDoor.y + nave.exitDoor.h * 0.45 - J.h / 2;
        J.x += (alvo - J.x) * 0.08;
        J.y += (alvoY - J.y) * 0.08;
        J.alpha = Math.max(0, 1 - timerFase / 40);
        if (timerFase === 45) {
          J.visivel = false;
          nave.estado = "decolando";
          Som.sfx("explosao");
          Som.tocar("assets/audio/ending.mp3", { loop: false });
        }
        if (timerFase > 45 + 170) iniciarVitoria();
      }
    }
    function desenharFundo() {
      const im = img[LevelManager.background(nivel)];
      if (Assets.ok(im)) {
        const w = Math.ceil(im.naturalWidth * (LH / im.naturalHeight));
        const total = w * 2;
        const off = camX * 0.16 % total;
        ctx.imageSmoothingEnabled = false;
        for (let i = -1; i < Math.ceil(LW / w) + 2; i++) {
          const x = i * w - off;
          const k = (i % 2 + 2) % 2;
          ctx.save();
          const tx = Math.round(x);
          if (k === 1) {
            ctx.translate(tx + w, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(im, 0, 0, w, LH);
          } else {
            ctx.translate(tx, 0);
            ctx.drawImage(im, 0, 0, w, LH);
          }
          ctx.restore();
        }
        ctx.imageSmoothingEnabled = true;
      } else {
        ctx.fillStyle = "#c4552d";
        ctx.fillRect(0, 0, LW, LH);
      }
      const atmosfera = nivel === 2 ? ["rgba(28,10,46,0.42)", "rgba(0,0,0,0)", "rgba(48,12,70,0.3)"] : nivel === 1 ? ["rgba(8,28,44,0.28)", "rgba(0,0,0,0)", "rgba(8,50,48,0.22)"] : ["rgba(30,8,10,0.35)", "rgba(0,0,0,0)", "rgba(30,8,10,0.25)"];
      const g = ctx.createLinearGradient(0, 0, 0, LH);
      g.addColorStop(0, atmosfera[0]);
      g.addColorStop(0.5, atmosfera[1]);
      g.addColorStop(1, atmosfera[2]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, LW, LH);
      if (nivel === 0) {
        ctx.fillStyle = "#fff";
        for (let i = 0; i < 40; i++) {
          ctx.globalAlpha = 0.3 + 0.5 * Math.sin(t * 0.05 + i);
          ctx.fillRect(((i * 173 - camX * (0.15 + i % 4 * 0.08)) % LW + LW) % LW, i * 61 % 380, 2, 2);
        }
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = nivel === 1 ? "rgba(160,255,190,0.75)" : "rgba(255,170,90,0.8)";
        for (let i = 0; i < 22; i++) ctx.fillRect(((i * 137 - camX * (0.6 + i % 3 * 0.3)) % LW + LW) % LW, ((i * 71 - t * (0.6 + i % 4 * 0.25)) % LH + LH) % LH, 3, 3);
      }
      ctx.fillStyle = nivel === 2 ? "rgba(196,128,255,0.28)" : nivel === 1 ? "rgba(94,234,212,0.25)" : "rgba(255,200,150,0.22)";
      for (let i = 0; i < 18; i++) {
        const sp = 0.5 + i % 5 * 0.28;
        const x = ((i * 211 - camX * (1.3 + sp)) % (LW + 200) + (LW + 200)) % (LW + 200) - 100;
        const y = 250 + i * 97 % 340;
        ctx.fillRect(x, y, 26 + i % 4 * 14, 2);
      }
    }
    function desenharChao() {
      const im = img.chao;
      if (Assets.ok(im)) {
        ctx.imageSmoothingEnabled = false;
        const tile = ALT_CHAO;
        const off = camX % tile;
        for (let x = -off; x < LW; x += tile) ctx.drawImage(im, Math.round(x), CHAO_Y, tile + 1, ALT_CHAO);
        ctx.imageSmoothingEnabled = true;
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = nivel === 2 ? "rgba(120,72,160,0.65)" : nivel === 1 ? "rgba(45,145,145,0.55)" : "rgba(205,100,55,0.6)";
        ctx.fillRect(0, CHAO_Y, LW, ALT_CHAO);
        ctx.globalCompositeOperation = "source-over";
      } else {
        ctx.fillStyle = "#a04a22";
        ctx.fillRect(0, CHAO_Y, LW, ALT_CHAO);
      }
      const g = ctx.createLinearGradient(0, CHAO_Y, 0, LH);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(15,2,0,0.6)");
      ctx.fillStyle = g;
      ctx.fillRect(0, CHAO_Y, LW, ALT_CHAO);
      ctx.fillStyle = nivel === 2 ? "rgba(22,10,34,0.95)" : nivel === 1 ? "rgba(7,28,36,0.95)" : "rgba(25,8,3,0.95)";
      ctx.fillRect(0, CHAO_Y - 3, LW, 4);
      ctx.fillStyle = nivel === 2 ? "rgba(218,160,255,0.45)" : nivel === 1 ? "rgba(94,234,212,0.35)" : "rgba(255,200,150,0.25)";
      ctx.fillRect(0, CHAO_Y + 1, LW, 2);
    }
    function desenharPlataformas() {
      const cor = nivel === 2 ? ["#d6a5ff", "#7546a0"] : nivel === 1 ? ["#9df7e5", "#277c7a"] : ["#f4c27a", "#9c4a26"];
      for (const p of plataformas) {
        const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
        g.addColorStop(0, cor[0]);
        g.addColorStop(1, cor[1]);
        ctx.fillStyle = g;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "rgba(255,255,255,0.42)";
        ctx.fillRect(p.x, p.y, p.w, 3);
        ctx.fillStyle = "rgba(5,8,18,0.5)";
        ctx.fillRect(p.x + 8, p.y + p.h, p.w - 16, 5);
      }
    }
    function sprite(im, x, y, w, h, flash, espelhar, alpha = 1) {
      if (!Assets.ok(im)) return false;
      ctx.save();
      if (alpha !== 1) ctx.globalAlpha = alpha;
      if (espelhar) {
        ctx.translate(x + w, y);
        ctx.scale(-1, 1);
        x = 0;
        y = 0;
      }
      ctx.drawImage(im, espelhar ? 0 : x, espelhar ? 0 : y, w, h);
      if (flash > 0) {
        const s = Assets.silhueta(im);
        if (s) {
          ctx.globalAlpha = alpha * 0.6;
          ctx.drawImage(s, espelhar ? 0 : x, espelhar ? 0 : y, w, h);
        }
      }
      ctx.restore();
      return true;
    }
    function sombra(cx, y, rx, a = 0.3) {
      ctx.fillStyle = `rgba(0,0,0,${a})`;
      ctx.beginPath();
      ctx.ellipse(cx, y, rx, rx * 0.17, 0, 0, PI2);
      ctx.fill();
    }
    function desenharAuraInimigo(e) {
      if (!e.aura) return;
      const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
      const raio = Math.max(e.w, e.h) * 0.72;
      const gradiente = ctx.createRadialGradient(cx, cy, 2, cx, cy, raio);
      gradiente.addColorStop(0, e.aura + "55");
      gradiente.addColorStop(1, e.aura + "00");
      ctx.fillStyle = gradiente;
      ctx.beginPath();
      ctx.arc(cx, cy, raio, 0, PI2);
      ctx.fill();
    }
    function desenharInimigo(e) {
      ctx.save();
      ctx.globalAlpha = 1;
      desenharAuraInimigo(e);
      if (e.tipo === "worm") {
        sombra(e.x + e.w / 2, CHAO_Y + 2, e.w * 0.45);
        const ondula = 1 + Math.sin(e.fase * 4) * 0.05;
        const h = e.h * ondula;
        ctx.save();
        if (e.tinta) ctx.filter = e.tinta;
        if (!sprite(img.worm, e.x, e.y + e.h - h, e.w, h, e.flash, true)) {
          ctx.fillStyle = "#4a6b2a";
          ctx.fillRect(e.x, e.y, e.w, e.h);
        }
        ctx.restore();
      } else if (e.tipo === "devorador") {
        sombra(e.x + e.w / 2, CHAO_Y + 2, e.w * 0.42, 0.28);
        const ondula = 1 + Math.sin(e.fase * 2.5) * 0.025;
        if (!sprite(img.hidra, e.x, e.y + e.h * (1 - ondula), e.w, e.h * ondula, e.flash, true)) {
          ctx.fillStyle = "#7bd13f";
          ctx.fillRect(e.x, e.y, e.w, e.h);
        }
      } else if (e.tipo === "guardiao") {
        sombra(e.x + e.w / 2, CHAO_Y + 2, e.w * 0.38, 0.32);
        ctx.imageSmoothingEnabled = false;
        ctx.save();
        if (e.tinta) ctx.filter = e.tinta;
        const spriteX = e.x - 8;
        const spriteW = e.w + 16;
        if (e.direction < 0) {
          ctx.translate(spriteX + spriteW, 0);
          ctx.scale(-1, 1);
        }
        const animado = !e.flash && SpriteAnimator.draw(
          ctx,
          img.guardianRun,
          Math.floor(t / 7),
          e.direction < 0 ? 0 : spriteX,
          e.y,
          spriteW,
          e.h,
          176,
          195,
          8
        );
        ctx.restore();
        if (!animado) {
          ctx.save();
          if (e.tinta) ctx.filter = e.tinta;
          const desenhado = sprite(img.guardiaoPlasma, e.x - 8, e.y, e.w + 16, e.h, e.flash, true);
          ctx.restore();
          if (!desenhado) {
            ctx.fillStyle = "#5eead4";
            ctx.fillRect(e.x, e.y, e.w, e.h);
          }
        }
        ctx.imageSmoothingEnabled = true;
      } else if (e.tipo === "bruxa") {
        const bob = Math.sin(e.fase * 2) * 5;
        sombra(e.x + e.w / 2, CHAO_Y + 2, e.w * 0.34, 0.2);
        if (!sprite(img.bruxaNucleo, e.x, e.y + bob, e.w, e.h, e.flash, false)) {
          ctx.fillStyle = "#c084fc";
          ctx.beginPath();
          ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2 + bob, e.w * 0.3, e.h * 0.45, 0, 0, PI2);
          ctx.fill();
        }
      } else if (e.tipo === "alien") {
        const alt = CHAO_Y - (e.y + e.h);
        sombra(e.x + e.w / 2, CHAO_Y + 2, e.w * 0.3, clamp(0.3 - alt / 900, 0.1, 0.3));
        ctx.imageSmoothingEnabled = false;
        ctx.save();
        if (e.tinta) ctx.filter = e.tinta;
        const im = img[e.sprite] || img.alien;
        if (!sprite(im, e.x, e.y, e.w, e.h * (1 + Math.sin(e.fase * 6) * 0.07), e.flash, e.direction > 0)) {
          ctx.fillStyle = "#7bd13f";
          ctx.fillRect(e.x, e.y, e.w, e.h);
        }
        ctx.restore();
        ctx.imageSmoothingEnabled = true;
      } else {
        const b = e;
        sombra(b.x + b.w / 2 + 10, CHAO_Y + 2, b.w * 0.5, 0.35);
        const respira = 1 + Math.sin(t * 0.08) * 0.012;
        const desenharChefe = (alpha) => {
          const tele = (b.ia === "cuspir" || b.ia === "espada") && b.ti < CONFIG_FASE[nivel].avisoAtaque || b.ia === "investida" && b.ti < 42;
          ctx.filter = b.hue ? "hue-rotate(" + b.hue + "deg)" : "none";
          const fl = tele ? (t >> 2 & 1) * 3 : b.flash;
          if (b.sprite === "bruxaChefe" && Assets.ok(img[b.sprite])) {
            const flutua = Math.sin(t * 0.07) * 9;
            sprite(img[b.sprite], b.x + b.jx, b.y + flutua, b.w, b.h, fl, false, alpha);
          } else if (b.sprite === "hidra" && Assets.ok(img[b.sprite])) {
            const hh = b.h * 1.02 * respira, ww = b.h * 1.02 * img.hidra.naturalWidth / img.hidra.naturalHeight;
            sprite(img.hidra, b.x + b.w / 2 - ww / 2 + b.jx, b.y + b.h - hh, ww, hh, fl, true, alpha);
          } else if (b.sprite === "worm" && Assets.ok(img.worm)) {
            const hh = b.h * 0.96 * respira, ww = hh * img.worm.naturalWidth / img.worm.naturalHeight;
            sprite(img.worm, b.x + b.w / 2 - ww / 2 + b.jx, b.y + b.h - hh, ww, hh, fl, true, alpha);
          } else if (Assets.ok(img[b.sprite])) {
            sprite(img[b.sprite], b.x + b.jx, b.y - (respira - 1) * b.h, b.w, b.h * respira, fl, true, alpha);
          } else sprite(img.chefe, b.x + b.jx, b.y - (respira - 1) * b.h, b.w, b.h * respira, fl, true, alpha);
          ctx.filter = "none";
        };
        if (estado === "chefeMorrendo") {
          ctx.save();
          ctx.translate(rand(-3, 3), rand(-2, 2));
          desenharChefe(clamp(1 - (timerFase - 70) / 40, 0, 1));
          ctx.restore();
        } else if (b.ia === "emergindo") {
          const k = Math.min(1, b.ti / 170);
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, LW, CHAO_Y + 6);
          ctx.clip();
          desenharChefe(clamp((k - 0.5) / 0.15, 0, 1));
          ctx.restore();
          const frameEmergencia = b.role === "worm" ? img["devoradorEmergencia" + (k < 0.15 ? 1 : k < 0.3 ? 2 : 3)] : null;
          if (Assets.ok(frameEmergencia) && k < 0.5) {
            const fw = Math.min(b.w * 1.4, frameEmergencia.naturalWidth * 1.25);
            const fh = fw * frameEmergencia.naturalHeight / frameEmergencia.naturalWidth;
            sprite(frameEmergencia, b.x + b.w / 2 - fw / 2, CHAO_Y + 34 - fh, fw, fh, 0, true, 1 - k);
          }
          const rachadura = img.emergenciaChao;
          if (Assets.ok(rachadura) && k < 0.72) {
            const fw = Math.min(b.w * 1.4, rachadura.naturalWidth * 1.25);
            const fh = fw * rachadura.naturalHeight / rachadura.naturalWidth;
            sprite(rachadura, b.x + b.w / 2 - fw / 2, CHAO_Y - fh * 0.55, fw, fh, 0, false, 1 - k);
          }
        } else {
          desenharChefe(1);
          if (b.role === "sentinel" && b.ia === "espada" && b.ti >= CONFIG_FASE[nivel].avisoAtaque - 8 && b.ti <= CONFIG_FASE[nivel].avisoAtaque + 10) {
            const progresso = (b.ti - (CONFIG_FASE[nivel].avisoAtaque - 8)) / 18;
            ctx.save();
            ctx.globalAlpha = Math.sin(progresso * Math.PI) * 0.95;
            ctx.strokeStyle = "#dceeff";
            ctx.lineWidth = 9;
            ctx.shadowColor = "#8ed8ff";
            ctx.shadowBlur = 22;
            ctx.beginPath();
            ctx.arc(b.x - 12, b.y + b.h * 0.55, 74, -1.05, 0.85);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
      ctx.restore();
    }
    function desenharJogador() {
      if (!J.visivel) return;
      if (J.invul > 0 && J.invul < 9e4 && J.invul >> 2 & 1 && !J.morto) return;
      const noAr = !J.noChao;
      const parado = !J.correndo;
      let chave = "a_run" + Math.floor(J.anim * 1.6) % 8;
      if (J.morto || J.invul > 95 && J.invul < 9e4) chave = "a_hurt";
      else if (noAr) chave = J.vy < 0 ? "a_jump" : "a_fall";
      else if (J.tiroAnim > 0) chave = "a_tiro";
      else if (parado) chave = "a_idle";
      const ox = chave === "a_tiro" ? 14 : 0;
      const novo = Assets.ok(img[chave]);
      const im = novo ? img[chave] : img.p1;
      const h = novo ? im.naturalHeight / 2 : J.h;
      const w = novo ? im.naturalWidth / 2 : Assets.ok(im) ? h * im.naturalWidth / im.naturalHeight : J.w;
      const oy = novo ? J.h / 2 - h : -h / 2;
      const bob = !noAr && !parado ? -Math.abs(Math.sin(J.anim * Math.PI)) * 3 : 0;
      const alt = CHAO_Y - (J.y + J.h);
      sombra(J.x + J.w / 2, CHAO_Y + 2, J.w * 0.55 * clamp(1 - alt / 400, 0.4, 1), 0.35);
      ctx.save();
      ctx.translate(J.x + J.w / 2, J.y + J.h / 2 + bob);
      ctx.scale(J.direcao < 0 ? -1 : 1, 1);
      if (J.morto) ctx.rotate(J.rot);
      else if (noAr) ctx.rotate(clamp(J.vy * 0.012, -0.12, 0.15) + clamp(J.vx * 0.02, -0.12, 0.12));
      ctx.globalAlpha = J.alpha;
      if (Assets.ok(im)) {
        ctx.drawImage(im, -w / 2 + ox, oy, w, h);
        if (J.invul > 0 && J.invul > 95 && J.invul < 9e4) {
          const s = Assets.silhueta(im);
          if (s) {
            ctx.globalAlpha = 0.8;
            ctx.drawImage(s, -w / 2 + ox, oy, w, h);
          }
        }
      } else {
        ctx.fillStyle = "#ccc";
        ctx.fillRect(-J.w / 2, -h / 2, J.w, h);
      }
      ctx.restore();
    }
    function desenharTiro(s) {
      const direcao = Math.sign(s.vx) || 1;
      const g = ctx.createLinearGradient(s.x - 34 * direcao, 0, s.x + 8 * direcao, 0);
      g.addColorStop(0, "rgba(56,189,248,0)");
      g.addColorStop(1, "rgba(125,211,252,0.9)");
      ctx.fillStyle = g;
      ctx.fillRect(s.x + (direcao > 0 ? -34 : -6), s.y - 3, 40, 6);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6, 0, PI2);
      ctx.fill();
      ctx.fillStyle = "rgba(125,211,252,0.4)";
      ctx.beginPath();
      ctx.arc(s.x, s.y, 11, 0, PI2);
      ctx.fill();
    }
    function desenharOrbe(o) {
      const cor = o.cor || "#7bd13f";
      if (o.tipo === "espada") {
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(Math.atan2(o.vy || 0, o.vx) + Math.sin(o.fase) * 0.08);
        ctx.shadowColor = "#bde7ff";
        ctx.shadowBlur = 18;
        ctx.fillStyle = "#e8f4ff";
        ctx.strokeStyle = "#52697d";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(42, 0);
        ctx.lineTo(-10, -9);
        ctx.lineTo(1, 0);
        ctx.lineTo(-10, 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#a97942";
        ctx.fillRect(-17, -4, 7, 8);
        ctx.fillStyle = "#dce8f0";
        ctx.fillRect(-10, -2, 4, 4);
        ctx.restore();
        return;
      }
      const rgb = cor.match(/[a-f\d]{2}/gi).map((parte) => parseInt(parte, 16));
      const g = ctx.createRadialGradient(o.x, o.y, 2, o.x, o.y, o.r * 1.9);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.45, cor);
      g.addColorStop(1, `rgba(${rgb.join(",")},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r * 1.9, 0, PI2);
      ctx.fill();
      ctx.fillStyle = cor;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r * 0.7, 0, PI2);
      ctx.fill();
      if (o.tipo === "baixo") {
        ctx.strokeStyle = cor;
        ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
          const a = o.fase + i * (PI2 / 6);
          ctx.beginPath();
          ctx.moveTo(o.x + Math.cos(a) * o.r * 0.7, o.y + Math.sin(a) * o.r * 0.7);
          ctx.lineTo(o.x + Math.cos(a) * o.r * 1.25, o.y + Math.sin(a) * o.r * 1.25);
          ctx.stroke();
        }
      } else if (o.tipo === "alvo") {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r * 1.15, 0, PI2);
        ctx.stroke();
      }
    }
    function tracarCoracao(cx, cy, s) {
      ctx.beginPath();
      ctx.moveTo(cx, cy + s * 0.95);
      ctx.bezierCurveTo(cx - s * 1.45, cy + s * 0.05, cx - s * 0.8, cy - s * 0.95, cx, cy - s * 0.3);
      ctx.bezierCurveTo(cx + s * 0.8, cy - s * 0.95, cx + s * 1.45, cy + s * 0.05, cx, cy + s * 0.95);
      ctx.closePath();
    }
    function coracao(cx, cy, s, cheio) {
      tracarCoracao(cx, cy, s);
      if (cheio) {
        const g = ctx.createLinearGradient(0, cy - s, 0, cy + s);
        g.addColorStop(0, "#ff6b8a");
        g.addColorStop(1, "#c0123a");
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = "rgba(20,10,16,0.75)";
      }
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = cheio ? "#4a0616" : "rgba(255,255,255,0.3)";
      ctx.stroke();
      if (cheio) {
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.beginPath();
        ctx.ellipse(cx - s * 0.5, cy - s * 0.35, s * 0.2, s * 0.12, -0.6, 0, PI2);
        ctx.fill();
      }
    }
    function desenharChave(it) {
      const cx = it.x + 14, cy = it.y + 14 + Math.sin(it.fase) * 6;
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 34);
      g.addColorStop(0, "rgba(255,209,102,0.6)");
      g.addColorStop(1, "rgba(255,209,102,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 34, 0, PI2);
      ctx.fill();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(it.fase * 0.7) * 0.25);
      ctx.fillStyle = "#ffd166";
      ctx.strokeStyle = "#7a4a05";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-8, 0, 9, 0, PI2);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(0, -3, 18, 6);
      ctx.strokeRect(0, -3, 18, 6);
      ctx.fillRect(12, 3, 4, 7);
      ctx.fillRect(6, 3, 4, 5);
      ctx.restore();
    }
    function desenharItem(it) {
      if (it.tipo === "chave") return desenharChave(it);
      const flut = Math.sin(it.fase) * 3;
      const cx = it.x + it.w / 2, cy = it.y + it.h / 2 + flut;
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 30);
      g.addColorStop(0, "rgba(255,120,150,0.55)");
      g.addColorStop(1, "rgba(255,120,150,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, PI2);
      ctx.fill();
      coracao(cx, cy, 13 + Math.sin(it.fase * 2) * 1.2, true);
    }
    function desenharNave() {
      if (!nave) return;
      if (nave.estado !== "decolando") sombra(nave.x + nave.w / 2, CHAO_Y + 2, nave.w * 0.45, 0.3);
      ctx.save();
      if (nave.estado === "decolando") {
        ctx.translate(nave.x + nave.w / 2, nave.y + nave.h / 2);
        ctx.rotate(-clamp(nave.vy * -0.03, 0, 0.35));
        ctx.translate(-(nave.x + nave.w / 2), -(nave.y + nave.h / 2));
      }
      if (!sprite(img.nave, nave.x, nave.y, nave.w, nave.h, 0, false)) {
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(nave.x, nave.y, nave.w, nave.h);
      }
      ctx.restore();
      if (nave.estado === "pousada" && estado === "desfecho") {
        const a = 0.6 + 0.4 * Math.sin(t * 0.12);
        ctx.fillStyle = `rgba(94,234,212,${a})`;
        ctx.font = `10px ${FONTE}`;
        ctx.textAlign = "center";
        ctx.fillText("CAMINHE AT\xC9 A PORTA PARA ENTRAR", nave.exitDoor.x + nave.exitDoor.w / 2, nave.y - 14 + Math.sin(t * 0.1) * 4);
      }
    }
    function desenharParticulas() {
      for (const p of particulas) {
        ctx.globalAlpha = clamp(p.vida / p.max, 0, 1);
        ctx.fillStyle = p.cor;
        ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = "center";
      for (const x of textos) {
        ctx.globalAlpha = clamp(x.vida / 20, 0, 1);
        ctx.font = `${x.tam}px ${FONTE}`;
        ctx.fillStyle = "#000";
        ctx.fillText(x.str, x.x + 2, x.y + 2);
        ctx.fillStyle = x.cor;
        ctx.fillText(x.str, x.x, x.y);
      }
      ctx.globalAlpha = 1;
    }
    function painelRetangulo(x, y, w, h, r = 12) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    function caixaHUD(x, y, w, h) {
      painelRetangulo(x, y, w, h);
      ctx.fillStyle = "rgba(8,10,18,0.62)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.stroke();
    }
    function textoHUD(str, x, y, tam, cor, alinha = "left") {
      ctx.font = `${tam}px ${FONTE}`;
      ctx.textAlign = alinha;
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.fillText(str, x + 2, y + 2);
      ctx.fillStyle = cor;
      ctx.fillText(str, x, y);
    }
    function desenharHUD() {
      const px = 22, py = 20;
      const larg = VIDAS_MAX * 46 + 22;
      caixaHUD(px, py, larg, 62);
      for (let i = 0; i < VIDAS_MAX; i++) {
        const pulso = pulsoCoracao[i] > 0 ? 1 + Math.sin(pulsoCoracao[i] / 22 * Math.PI) * 0.45 : 1;
        coracao(px + 34 + i * 46, py + 31, 15 * pulso, i < J.vidas);
      }
      textoHUD("JATO " + Math.round(J.comb) + "%", px, py + 98, 8, J.comb > 25 ? "#7dd3fc" : "#ff5a6e");
      const pw = 300, pxx = LW - pw - 22;
      caixaHUD(pxx, py, pw, 62);
      textoHUD("PONTOS", pxx + 16, py + 24, 9, "#9aa7b5");
      const esc = 1 + (pulsoPontos > 0 ? pulsoPontos * 0.012 : 0);
      ctx.save();
      ctx.translate(pxx + pw - 16, py + 50);
      ctx.scale(esc, esc);
      textoHUD(fmt(pontos), 0, 0, 22, "#ffffff", "right");
      ctx.restore();
      textoHUD("RECORDE " + fmt(Math.max(recorde, pontos)), pxx + pw, py + 82, 8, "#ffd166", "right");
      const mult = multiplicador();
      if (cadeia >= 2 && comboTimer > 0) {
        const bx = pxx, by2 = py + 96;
        textoHUD("COMBO x" + mult, bx + pw, by2 + 12, 14, mult >= 3 ? "#ff8d3d" : "#ffd166", "right");
        textoHUD(cadeia + " seguidos", bx + pw - 160, by2 + 26, 7, "#9aa7b5", "right");
      }
      const by = 26;
      if (chefe && chefe.vivo) {
        const largura = 430, altura = 54;
        const x = (LW - largura) / 2, y = 16;
        const margem = 14, barraX = x + margem, barraY = y + 23;
        const barraLargura = largura - margem * 2, barraAltura = 12;
        const vida = clamp(chefe.hp / chefe.hpMax, 0, 1);
        caixaHUD(x, y, largura, altura);
        textoHUD(chefe.nome, LW / 2, y + 16, 8, "#ffb2b8", "center");
        ctx.fillStyle = "rgba(0,0,0,0.72)";
        ctx.fillRect(barraX, barraY, barraLargura, barraAltura);
        const preenchimento = ctx.createLinearGradient(barraX, 0, barraX + barraLargura, 0);
        preenchimento.addColorStop(0, "#ff6676");
        preenchimento.addColorStop(1, "#c91d43");
        ctx.fillStyle = preenchimento;
        ctx.fillRect(barraX, barraY, barraLargura * vida, barraAltura);
        ctx.strokeStyle = "rgba(255,255,255,0.72)";
        ctx.lineWidth = 1;
        ctx.strokeRect(barraX + 0.5, barraY + 0.5, barraLargura - 1, barraAltura - 1);
        textoHUD(
          Math.max(0, Math.ceil(chefe.hp)) + "/" + chefe.hpMax,
          LW / 2,
          y + 49,
          7,
          "#ffffff",
          "center"
        );
      } else if (fase !== "chefeMorrendo" && fase !== "desfecho") {
        textoHUD("FASE " + (nivel + 1) + "   ABATES " + Math.min(kills, META_KILLS) + "/" + META_KILLS + "   CHAVES " + chaves + "/3", LW / 2, by + 6, 8, chaves >= 3 ? "#ffd166" : "#cbd5e1", "center");
      }
      textoHUD("P pausa   M " + (Som.mudo ? "som: OFF" : "som: ON"), LW - 22, LH - 14, 8, "rgba(255,255,255,0.55)", "right");
    }
    function desenharOverlays() {
      if (flashDano > 0) {
        const a = clamp(flashDano / 34, 0, 1) * 0.55;
        const g = ctx.createRadialGradient(LW / 2, LH / 2, LH * 0.3, LW / 2, LH / 2, LH * 0.95);
        g.addColorStop(0, "rgba(255,0,40,0)");
        g.addColorStop(1, `rgba(255,0,40,${a})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, LW, LH);
      }
      if (flashBranco > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flashBranco / 20 * 0.8})`;
        ctx.fillRect(0, 0, LW, LH);
      }
      if (J.vidas === 1 && !J.morto && estado === "jogando") {
        const a = 0.12 + 0.1 * Math.sin(t * 0.1);
        const g = ctx.createRadialGradient(LW / 2, LH / 2, LH * 0.45, LW / 2, LH / 2, LH);
        g.addColorStop(0, "rgba(255,0,40,0)");
        g.addColorStop(1, `rgba(255,0,40,${a})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, LW, LH);
      }
      if (estado === "contagem") {
        const n = Math.floor(contagem / 55);
        const k = contagem % 55 / 55;
        const str = n < 3 ? String(3 - n) : "VAI!";
        const tam = 110 * (1.25 - k * 0.25);
        ctx.save();
        ctx.globalAlpha = clamp(1.4 - k * 1.1, 0, 1);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${tam}px ${FONTE}`;
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillText(str, LW / 2 + 6, LH * 0.42 + 6);
        ctx.fillStyle = n < 3 ? "#ffffff" : "#5eead4";
        ctx.fillText(str, LW / 2, LH * 0.42);
        ctx.restore();
        textoHUD("PREPARE-SE", LW / 2, LH * 0.25, 14, "#cbd5e1", "center");
      }
      if (bannerFase > 0 && estado !== "contagem") {
        ctx.save();
        ctx.globalAlpha = clamp(bannerFase / 40, 0, 1) * clamp((190 - bannerFase) / 25, 0, 1);
        textoHUD("FASE " + (nivel + 1), LW / 2, LH * 0.36, 40, "#ffffff", "center");
        textoHUD(NOMES[nivel], LW / 2, LH * 0.36 + 44, 16, "#ffd166", "center");
        textoHUD("COLETE 3 CHAVES E ENFRENTE O GUARDI\xC3O", LW / 2, LH * 0.36 + 78, 9, "#cbd5e1", "center");
        ctx.restore();
      }
      if (alertaChefe > 0) {
        const a = alertaChefe >> 3 & 1 ? 1 : 0.35;
        ctx.save();
        ctx.globalAlpha = Math.min(1, alertaChefe / 30) * a;
        ctx.fillStyle = "rgba(160,0,30,0.55)";
        ctx.fillRect(0, LH * 0.3, LW, 90);
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = Math.min(1, alertaChefe / 30);
        textoHUD("\u26A0 ALERTA \u26A0", LW / 2, LH * 0.3 + 38, 26, "#ffffff", "center");
        textoHUD((chefe ? chefe.nome : "") + " SE APROXIMA", LW / 2, LH * 0.3 + 72, 12, "#ffd1d1", "center");
        ctx.restore();
      }
    }
    function desenhar() {
      ctx.setTransform(escala, 0, 0, escala, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, LW, LH);
      ctx.save();
      if (tremor > 0.3) {
        const k = REDUZ ? 0.12 : 0.6;
        ctx.translate(rand(-tremor, tremor) * k, rand(-tremor, tremor) * k);
      }
      desenharFundo();
      desenharChao();
      desenharPlataformas();
      itens.forEach(desenharItem);
      for (const e of inimigos) if (e.vivo && e.tipo !== "chefe") desenharInimigo(e);
      if (chefe && (chefe.vivo || estado === "chefeMorrendo")) desenharInimigo(chefe);
      desenharNave();
      desenharJogador();
      orbes.forEach(desenharOrbe);
      tiros.forEach(desenharTiro);
      desenharParticulas();
      ctx.restore();
      desenharOverlays();
      desenharHUD();
    }
    function loop(agora) {
      if (!rodando) return;
      const dt = Math.min(100, agora - ultimo);
      ultimo = agora;
      lerPad();
      if (estado !== "pausado" && estado !== "fim") {
        acumulador += dt;
        while (acumulador >= PASSO) {
          passo();
          acumulador -= PASSO;
        }
      } else if (estado === "fim") {
        acumulador += dt;
        while (acumulador >= PASSO) {
          t++;
          atualizarParticulas();
          atualizarNave();
          if (tremor > 0) tremor *= 0.9;
          acumulador -= PASSO;
        }
      } else {
        acumulador = 0;
      }
      desenhar();
      raf = requestAnimationFrame(loop);
    }
    const REDUZ = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pad = {};
    input.attach({
      enabled: () => rodando,
      onMute: () => Som.alternarMudo(),
      onPause: alternarPausa,
      onConfirm: () => {
        if (!acaoEnter) return false;
        acaoEnter();
        return true;
      },
      onRestart: () => {
        if (estado !== "fim" && estado !== "pausado") return false;
        reiniciar();
        return true;
      },
      onInteract: tentarEmbarcar,
      onJump: () => {
        if (estado === "desfecho" && tentarEmbarcar()) return;
        if (J) J.bufPulo = 8;
      },
      onBlur: () => {
        if (rodando && (estado === "jogando" || estado === "contagem")) alternarPausa();
      }
    });
    if (matchMedia("(pointer: coarse)").matches) document.getElementById("containerGame").classList.add("touch");
    document.querySelectorAll("#toque button").forEach((b) => {
      const k = b.dataset.k;
      const ligar = (on) => (e) => {
        e.preventDefault();
        if (!rodando) return;
        if (k) {
          if (on && !teclas[k] && k === "ArrowUp" && estado === "desfecho" && tentarEmbarcar()) {
            b.classList.add("on");
            return;
          }
          if (on && !teclas[k] && k === "ArrowUp") J.bufPulo = 8;
          teclas[k] = on;
          b.classList.toggle("on", on);
        } else if (on) {
          if (b.dataset.a === "p") alternarPausa();
          else Som.alternarMudo();
        }
      };
      b.addEventListener("pointerdown", ligar(true));
      ["pointerup", "pointercancel", "pointerleave"].forEach((n) => b.addEventListener(n, ligar(false)));
    });
    function lerPad() {
      const g = navigator.getGamepads ? [...navigator.getGamepads()].find((x) => x) : null;
      const b = (i) => !!(g && g.buttons[i] && g.buttons[i].pressed);
      const ax = g ? g.axes[0] : 0;
      pad.esq = ax < -0.4 || b(14);
      pad.dir = ax > 0.4 || b(15);
      const pulo = b(0) || b(12);
      if (pulo && !pad.pulo && J && estado === "jogando") J.bufPulo = 8;
      pad.pulo = pulo;
      pad.tiro = b(2) || b(1) || b(5) || b(7);
      const st = b(9);
      if (st && !pad.st) {
        if (acaoEnter) acaoEnter();
        else alternarPausa();
      }
      pad.st = st;
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && rodando && (estado === "jogando" || estado === "contagem")) alternarPausa();
    });
    window.iniciarJogo = iniciar;
    window.pararJogo = parar;
    window.Jogo = {
      iniciar,
      parar,
      reiniciar,
      // utilitários de depuração/teste
      _debug: {
        estado: () => ({
          estado,
          fase,
          nivel,
          background: LevelManager.background(nivel),
          inimigos: inimigos.filter((e) => e.tipo !== "chefe").map((e) => e.sprite || e.tipo),
          chefeSprite: chefe && chefe.sprite,
          kills,
          pontos,
          vidas: J && J.vidas,
          chefeRole: chefe && chefe.role,
          chefeHp: chefe && chefe.hp,
          chefeIA: chefe && chefe.ia,
          chefeForma: chefe && chefe.formIndex,
          chefeUltimoAtaque: chefe && chefe.ultimoAtaque,
          chefeX: chefe && chefe.x,
          chefeY: chefe && chefe.y,
          nave: nave && { estado: nave.estado, x: nave.x, y: nave.y, porta: nave.exitDoor },
          jogador: J && caixaJ(),
          podeEmbarcar: !!(nave && nave.canBoard(caixaJ())),
          projeteis: orbes.length,
          ataquesAgendados: chefe ? chefe.rajada.length : 0
        }),
        posicionarJogador(x, y) {
          if (J) {
            J.x = x;
            J.y = y;
            J.vx = 0;
            J.vy = 0;
          }
        },
        irParaChefe() {
          kills = META_KILLS - 1;
          if (estado === "contagem") {
            estado = "jogando";
          }
          spawnar();
          inimigos[inimigos.length - 1].x = 600;
          inimigos[inimigos.length - 1].hp = 1;
        },
        ferirChefe(n) {
          if (chefe) {
            chefe.hp = Math.max(1, n);
          }
        },
        matarChefe() {
          if (chefe) {
            chefe.hp = 0;
            matarInimigo(chefe);
          }
        },
        embarcar: tentarEmbarcar,
        vidas(n) {
          J.vidas = n;
        },
        pular() {
          if (estado === "contagem") {
            estado = "jogando";
            contagem = 0;
          }
        },
        fase(n) {
          nivel = clamp(Math.floor(n), 0, 2);
          camX = 0;
          bannerFase = 0;
          inimigos = [];
          chefe = null;
          fase = "corrida";
        },
        ativarChefe() {
          if (!J) return;
          inimigos = [];
          chefe = null;
          fase = "corrida";
          estado = "jogando";
          iniciarChefe();
        }
      }
    };
  })();

  // js/scenes/menu.js
  var textoProjeto = document.getElementById("textProjeto");
  var subtituloProjeto = document.getElementById("subtitleProjeto");
  var botaoProjeto = document.getElementById("buttonProjeto");
  var menuProj = document.getElementById("menuProj");
  var menuGame = document.getElementById("menuGame");
  var botaoGame = document.getElementById("buttonGame");
  var containerGame = document.getElementById("containerGame");
  var cortina = document.getElementById("cortina");
  var recordeMenu = document.getElementById("recordeMenu");
  var transicionando = false;
  var iniciandoMenu = false;
  function lerRecorde() {
    try {
      return parseInt(localStorage.getItem("laevatein_recorde"), 10) || 0;
    } catch (e) {
      return 0;
    }
  }
  window.voltarAoMenu = voltarAoMenu;
  function atualizarRecordeMenu() {
    const r = lerRecorde();
    recordeMenu.textContent = r > 0 ? `RECORDE  ${String(r).padStart(7, "0")}` : "";
  }
  Intro.iniciar();
  Assets.pronto.then(() => {
    Intro.iniciar();
    botaoProjeto.disabled = false;
    botaoProjeto.textContent = "COME\xC7AR";
  });
  botaoProjeto.addEventListener("click", () => {
    if (iniciandoMenu) return;
    iniciandoMenu = true;
    Som.desbloquear();
    Som.sfx("clique");
    textoProjeto.classList.add("introSaindo");
    subtituloProjeto.classList.add("introSaindo");
    botaoProjeto.classList.add("introSaindo");
    botaoProjeto.disabled = true;
    botaoProjeto.classList.add("preparando");
    botaoProjeto.textContent = "PREPARANDO...";
    textoProjeto.innerText = "PREPARE-SE, ASTRONAUTA";
    setTimeout(() => {
      menuProj.style.display = "none";
      atualizarRecordeMenu();
      menuGame.classList.remove("oculto");
      setTimeout(() => menuGame.classList.add("ativo"), 100);
    }, 3e3);
  });
  botaoGame.addEventListener("click", () => {
    if (transicionando) return;
    transicionando = true;
    Som.desbloquear();
    Som.sfx("clique");
    menuGame.classList.add("saindo");
    Intro.saida();
    setTimeout(() => cortina.classList.add("ativa"), 1e3);
    setTimeout(() => {
      menuGame.style.display = "none";
      Intro.parar();
      containerGame.classList.remove("oculto");
      window.iniciarJogo();
      setTimeout(() => {
        containerGame.classList.add("mostrarJogo");
        cortina.classList.remove("ativa");
        transicionando = false;
      }, 60);
    }, 1650);
  });
  function voltarAoMenu() {
    if (transicionando) return;
    transicionando = true;
    cortina.classList.add("ativa");
    setTimeout(() => {
      window.pararJogo();
      Som.parar();
      containerGame.classList.remove("mostrarJogo");
      containerGame.classList.add("oculto");
      Intro.reiniciarEntrada();
      Intro.iniciar();
      atualizarRecordeMenu();
      menuGame.style.display = "";
      menuGame.classList.remove("saindo");
      menuGame.classList.add("ativo");
      cortina.classList.remove("ativa");
      transicionando = false;
    }, 650);
  }

  // js/main.js
  window.AppState = AppState;
})();
