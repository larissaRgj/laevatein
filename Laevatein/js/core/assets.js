/* ============================================================
   assets.js  —  carregamento de imagens e sistema de som
   ============================================================ */
'use strict';

import { AssetLoader } from './asset-loader.js';

export const Assets = (() => {
    const lista = {
        a_run0: 'assets/images/player/a_run0.png',
        a_run1: 'assets/images/player/a_run1.png',
        a_run2: 'assets/images/player/a_run2.png',
        a_run3: 'assets/images/player/a_run3.png',
        a_run4: 'assets/images/player/a_run4.png',
        a_run5: 'assets/images/player/a_run5.png',
        a_run6: 'assets/images/player/a_run6.png',
        a_run7: 'assets/images/player/a_run7.png',
        a_idle: 'assets/images/player/a_idle.png',
        a_jump: 'assets/images/player/a_jump.png',
        a_fall: 'assets/images/player/a_fall.png',
        a_hurt: 'assets/images/player/a_hurt.png',
        a_tiro: 'assets/images/player/a_tiro.png',
        emergenciaChao: 'assets/images/environment/boss-emergence-ground.png',
        hidra: 'assets/images/boss/hidra.png',
        marte: 'assets/images/backgrounds/marte.png',
        chao: 'assets/images/environment/chao.png',
        p1: 'assets/images/backgrounds/p1.png',
        p2: 'assets/images/backgrounds/p2.png',
        worm: 'assets/images/enemies/worm.png',
        alien: 'assets/images/enemies/alien.png',
        cacadorPlasma: 'assets/images/enemies/cacador-plasma.png',
        chefe: 'assets/images/boss/chefe.png',
        nave: 'assets/images/environment/nave.png'
    };

    Object.assign(lista, {
        cenarioFase1: 'assets/images/backgrounds/cenario-fase1.png',
        cenarioFase1Jogo: 'assets/images/backgrounds/background-jupiter-desert.png',
        cenarioFase2: 'assets/images/backgrounds/cenario-fase2-saturno.png',
        cenarioFase3: 'assets/images/backgrounds/cenario-fase3-gelo.png',
        guardiaoPlasma: 'assets/images/enemies/guardiao-plasma.png',
        bruxaNucleo: 'assets/images/boss/bruxa-nucleo.png',
        bruxaChefe: 'assets/images/boss/bruxa-chefe.png'
    });

    lista.sentinelaChefe = 'assets/images/boss/sentinela-base-chefe.png';
    lista.guardianRun = 'assets/images/enemies/guardian-run-sheet.png';
    lista.devoradorEmergencia1 = 'assets/images/boss/devorador-emergence-1.png';
    lista.devoradorEmergencia2 = 'assets/images/boss/devorador-emergence-2.png';
    lista.devoradorEmergencia3 = 'assets/images/boss/devorador-emergence-3.png';

    const img = {};
    const pronto = AssetLoader.loadImages(lista).then(loaded => Object.assign(img, loaded));

    const ok = i => !!i && i.complete && i.naturalWidth > 0;

    // Versão toda branca de um sprite (efeito de "piscar" ao levar dano)
    const cacheSilhueta = new Map();
    function silhueta(i) {
        if (!ok(i)) return null;
        if (cacheSilhueta.has(i)) return cacheSilhueta.get(i);
        const c = document.createElement('canvas');
        c.width = i.naturalWidth;
        c.height = i.naturalHeight;
        const x = c.getContext('2d');
        x.drawImage(i, 0, 0);
        x.globalCompositeOperation = 'source-in';
        x.fillStyle = '#ffffff';
        x.fillRect(0, 0, c.width, c.height);
        cacheSilhueta.set(i, c);
        return c;
    }

    return { img, pronto, ok, silhueta };
})();


export const Som = (() => {
    let ac = null;
    let mudo = false;
    let musica = null;
    let fadeTimer = null;
    const VOL_MUSICA = 0.55;

    try { mudo = localStorage.getItem('laevatein_mudo') === '1'; } catch (e) { /* sem storage */ }

    function contexto() {
        if (!ac) {
            try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; }
        }
        if (ac && ac.state === 'suspended') ac.resume();
        return ac;
    }

    function desbloquear() { contexto(); }

    // ---------- Música ----------
    function tocar(src, { loop = true, vol = VOL_MUSICA } = {}) {
        parar();
        musica = AssetLoader.loadAudio(src);
        musica.loop = loop;
        musica.volume = mudo ? 0 : vol;
        musica._vol = vol;
        musica.play().catch(() => { /* o navegador pode bloquear; o jogo segue sem música */ });
    }

    function parar() {
        clearInterval(fadeTimer);
        if (musica) { musica.pause(); musica = null; }
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
            if (k >= 1) { clearInterval(fadeTimer); m.pause(); }
        }, 50);
    }

    function pausar() { if (musica) musica.pause(); }
    function retomar() { if (musica && !mudo) musica.play().catch(() => {}); else if (musica) musica.play().catch(() => {}); }

    function alternarMudo() {
        mudo = !mudo;
        if (musica) musica.volume = mudo ? 0 : musica._vol;
        try { localStorage.setItem('laevatein_mudo', mudo ? '1' : '0'); } catch (e) { /* ok */ }
        return mudo;
    }

    // ---------- Efeitos sonoros sintetizados ----------
    function tom(f0, f1, dur, tipo = 'square', vol = 0.08, atraso = 0) {
        const a = contexto();
        if (!a || mudo) return;
        const t = a.currentTime + atraso;
        const o = a.createOscillator();
        const g = a.createGain();
        o.type = tipo;
        o.frequency.setValueAtTime(f0, t);
        o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
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
        filtro.type = 'lowpass';
        filtro.frequency.value = freq;
        const g = a.createGain();
        g.gain.value = vol;
        src.connect(filtro).connect(g).connect(a.destination);
        src.start();
    }

    const efeitos = {
        tiro:    () => { tom(980, 260, 0.09, 'square', 0.05); },
        pulo:    () => { tom(260, 620, 0.14, 'sine', 0.09); },
        acerto:  () => { tom(220, 110, 0.07, 'triangle', 0.09); },
        morte:   () => { ruido(0.28, 0.2, 1800); tom(300, 60, 0.25, 'sawtooth', 0.07); },
        dano:    () => { tom(340, 50, 0.4, 'sawtooth', 0.12); ruido(0.3, 0.18, 900); },
        coletar: () => { tom(660, 660, 0.09, 'square', 0.07); tom(990, 990, 0.14, 'square', 0.07, 0.09); },
        orbe:    () => { tom(170, 90, 0.25, 'sine', 0.14); },
        alerta:  () => { tom(440, 440, 0.25, 'square', 0.07); tom(330, 330, 0.25, 'square', 0.07, 0.3); tom(440, 440, 0.25, 'square', 0.07, 0.6); },
        explosao:() => { ruido(0.6, 0.3, 700); tom(140, 30, 0.6, 'sawtooth', 0.12); },
        contagem:() => { tom(520, 520, 0.12, 'square', 0.07); },
        vai:     () => { tom(780, 780, 0.35, 'square', 0.08); },
        clique:  () => { tom(600, 900, 0.05, 'square', 0.05); },
        jato:    () => { ruido(0.07, 0.05, 2600); }
    };

    function sfx(nome) { if (efeitos[nome]) efeitos[nome](); }

    return { desbloquear, tocar, parar, fade, pausar, retomar, alternarMudo, sfx,
             get mudo() { return mudo; } };
})();
