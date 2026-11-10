/* ============================================================
   intro.js  —  cena de abertura: espaço + Marte + astronauta
   ============================================================ */
'use strict';

import { Assets } from '../core/assets.js';

export const Intro = (() => {
    const cv = document.getElementById('telaIntro');
    const c = cv.getContext('2d');

    let W = 0, H = 0, dpr = 1;
    let raf = 0, rodando = false, ultimo = 0, tempo = 0;
    let estrelas = [], cometas = [], poeira = [];
    let cenarioMascarado = null;
    let nave = null, proximaNave = 5;
    let pulo = { ativo: false, t: 0, proximo: 4.5 };

    const rand = (a, b) => a + Math.random() * (b - a);

    function altChao() { return Math.max(90, H * 0.15); }

    function redimensionar() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
        c.setTransform(dpr, 0, 0, dpr, 0, 0);

        estrelas = [];
        const n = Math.round(W * H / 5000);
        for (let i = 0; i < n; i++) {
            estrelas.push({
                x: Math.random() * W, y: Math.random() * H * 0.8,
                r: Math.random() * 1.4 + 0.3,
                v: Math.random() * 2 + 0.5, f: Math.random() * 6.28
            });
        }
        prepararMarte();
        cabine = null;
    }

    // Paisagem de Marte com o céu se dissolvendo no espaço (máscara em degradê)
    function prepararMarte() {
        const im = Assets.img.cenarioFase1;
        if (!Assets.ok(im)) { cenarioMascarado = null; return; }
        const esc = Math.max(W / im.naturalWidth, (H * 0.78) / im.naturalHeight);
        const w = Math.ceil(im.naturalWidth * esc);
        const h = Math.ceil(im.naturalHeight * esc);
        const o = document.createElement('canvas');
        o.width = w; o.height = h;
        const x = o.getContext('2d');
        x.drawImage(im, 0, 0, w, h);
        x.globalCompositeOperation = 'destination-in';
        const g = x.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(0.30, 'rgba(0,0,0,0)');
        g.addColorStop(0.58, 'rgba(0,0,0,1)');
        g.addColorStop(1, 'rgba(0,0,0,1)');
        x.fillStyle = g;
        x.fillRect(0, 0, w, h);
        cenarioMascarado = { cv: o, w, h };
    }

    // ---------- Elementos do cenário ----------
    function desenharEspaco() {
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#04060d');
        g.addColorStop(0.55, '#150c1c');
        g.addColorStop(1, '#3a1a14');
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);

        for (const s of estrelas) {
            const a = 0.45 + 0.55 * Math.sin(tempo * s.v + s.f);
            c.globalAlpha = Math.max(0.1, a);
            c.fillStyle = '#fff';
            c.fillRect(s.x, s.y, s.r, s.r);
        }
        c.globalAlpha = 1;

        // cometas
        for (let i = cometas.length - 1; i >= 0; i--) {
            const m = cometas[i];
            m.x += m.vx; m.y += m.vy; m.vida -= 0.016;
            const grad = c.createLinearGradient(m.x, m.y, m.x - m.vx * 14, m.y - m.vy * 14);
            grad.addColorStop(0, `rgba(255,255,255,${Math.max(0, m.vida)})`);
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            c.strokeStyle = grad;
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(m.x, m.y);
            c.lineTo(m.x - m.vx * 14, m.y - m.vy * 14);
            c.stroke();
            if (m.vida <= 0) cometas.splice(i, 1);
        }
        if (Math.random() < 0.006) {
            cometas.push({ x: rand(W * 0.2, W), y: rand(0, H * 0.3), vx: rand(-9, -6), vy: rand(2, 4), vida: 1 });
        }
    }

    function desenharPlaneta() {
        const r = Math.min(W, H) * 0.26;
        const cx = W * 0.80 + Math.sin(tempo * 0.1) * 4;
        const cy = H * 0.27;

        // brilho atmosférico
        let g = c.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.45);
        g.addColorStop(0, 'rgba(255,120,60,0.35)');
        g.addColorStop(1, 'rgba(255,120,60,0)');
        c.fillStyle = g;
        c.beginPath(); c.arc(cx, cy, r * 1.45, 0, 6.2832); c.fill();

        // esfera
        g = c.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
        g.addColorStop(0, '#f09a64');
        g.addColorStop(0.55, '#c4552d');
        g.addColorStop(1, '#5a1d10');
        c.fillStyle = g;
        c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.fill();

        c.save();
        c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.clip();
        // manchas / crateras
        const marcas = [[-0.35, 0.1, 0.22], [0.25, -0.3, 0.16], [0.35, 0.35, 0.2], [-0.1, -0.5, 0.12], [-0.5, -0.35, 0.1], [0.05, 0.55, 0.14]];
        for (const [mx, my, mr] of marcas) {
            c.fillStyle = 'rgba(90,30,16,0.35)';
            c.beginPath(); c.arc(cx + mx * r, cy + my * r, mr * r, 0, 6.2832); c.fill();
            c.strokeStyle = 'rgba(255,190,140,0.18)';
            c.lineWidth = 2;
            c.beginPath(); c.arc(cx + mx * r - 2, cy + my * r - 2, mr * r, 3.6, 5.5); c.stroke();
        }
        // calota polar
        c.fillStyle = 'rgba(255,240,230,0.55)';
        c.beginPath(); c.ellipse(cx - r * 0.1, cy - r * 0.97, r * 0.35, r * 0.1, 0, 0, 6.2832); c.fill();
        // sombra (lado noturno)
        g = c.createRadialGradient(cx - r * 0.5, cy - r * 0.5, r * 0.7, cx + r * 0.2, cy + r * 0.2, r * 1.5);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,10,0.45)');
        c.fillStyle = g;
        c.fillRect(cx - r, cy - r, r * 2, r * 2);
        c.restore();

        // lua (Fobos)
        const ang = tempo * 0.12;
        const lx = cx + Math.cos(ang) * r * 1.7;
        const ly = cy + Math.sin(ang) * r * 0.5 - r * 0.2;
        c.fillStyle = '#9a9a9a';
        c.beginPath(); c.arc(lx, ly, r * 0.1, 0, 6.2832); c.fill();
        c.fillStyle = 'rgba(0,0,0,0.35)';
        c.beginPath(); c.arc(lx + r * 0.03, ly + r * 0.03, r * 0.1, 0, 6.2832); c.fill();
    }

    function desenharPaisagem() {
        if (!cenarioMascarado) return;
        const { cv: o, w, h } = cenarioMascarado;
        // faixa espelhada para rolar sem emenda
        const desloc = (tempo * 26) % (w * 2);
        const y = H - h;
        for (let i = -1; i < Math.ceil(W / w) + 2; i++) {
            const x = Math.round(i * w - desloc);
            const k = ((i % 2) + 2) % 2;
            c.save();
            if (k === 1) { c.translate(x + w, y); c.scale(-1, 1); c.drawImage(o, 0, 0); }
            else { c.translate(x, y); c.drawImage(o, 0, 0); }
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
            const desloc = (tempo * 240) % t;
            for (let x = -desloc; x < W; x += t) c.drawImage(im, x, y, t, ag);
            c.imageSmoothingEnabled = true;
            c.globalCompositeOperation = 'multiply';
            c.fillStyle = 'rgba(200,95,50,0.55)';
            c.fillRect(0, y, W, ag);
            c.globalCompositeOperation = 'source-over';
        } else {
            c.fillStyle = '#a04a22';
            c.fillRect(0, y, W, ag);
        }
        const g = c.createLinearGradient(0, y, 0, H);
        g.addColorStop(0, 'rgba(0,0,0,0.0)');
        g.addColorStop(1, 'rgba(10,0,0,0.65)');
        c.fillStyle = g;
        c.fillRect(0, y, W, ag);
        c.fillStyle = 'rgba(20,6,2,0.9)';
        c.fillRect(0, y - 3, W, 4);
    }

    // ---------- Nave que cruza o céu ----------
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
        // chama do motor
        for (let i = 0; i < 2; i++) {
            poeira.push({ x: nave.x + 6, y: y + h * 0.45 + rand(-8, 8), vx: rand(-90, -40), vy: rand(-8, 8), vida: 0.5, max: 0.5, r: rand(3, 6), cor: '255,160,60' });
        }
        if (Assets.ok(im)) c.drawImage(im, nave.x, y, w, h);
        if (nave.x > W + 50) { nave = null; proximaNave = rand(12, 18); }
    }

    // ---------- Astronauta ----------
    function desenharAstronauta(dt) {
        const ag = altChao();
        const chaoY = H - ag + ag * 0.22;           // pés levemente dentro do chão
        const alt = Math.max(120, Math.min(210, H * 0.22));

        // entrada correndo pela esquerda
        const alvoX = Math.max(W * 0.22, 120);
        const entrada = Math.min(1, tempo / 3.2);
        const ease = 1 - Math.pow(1 - entrada, 3);
        const x = -120 + (alvoX + 120) * ease;
        const chegou = entrada >= 1;

        // salto ocasional
        let dy = 0;
        if (chegou) {
            pulo.proximo -= dt;
            if (!pulo.ativo && pulo.proximo <= 0) { pulo.ativo = true; pulo.t = 0; }
            if (pulo.ativo) {
                pulo.t += dt;
                const d = 0.75;
                const k = pulo.t / d;
                dy = -Math.sin(Math.min(1, k) * Math.PI) * alt * 0.55;
                if (k >= 1) { pulo.ativo = false; pulo.proximo = rand(3.5, 6); }
            }
        }

        const im = Assets.img[pulo.ativo ? 'a_jump' : 'a_run' + (Math.floor(tempo / 0.07) % 8)];
        const bob = pulo.ativo ? 0 : Math.abs(Math.sin(tempo * 11)) * -5;

        // sombra
        const sc = 1 - Math.min(0.5, -dy / (alt * 1.2));
        c.fillStyle = 'rgba(0,0,0,0.35)';
        c.beginPath(); c.ellipse(x, chaoY + 4, alt * 0.26 * sc, alt * 0.05 * sc, 0, 0, 6.2832); c.fill();

        if (Assets.ok(im)) {
            const w = alt * im.naturalWidth / im.naturalHeight;
            c.drawImage(im, x - w / 2, chaoY - alt + dy + bob, w, alt);
        }

        // poeira dos pés
        if (!pulo.ativo && Math.random() < 0.5) {
            poeira.push({ x: x - alt * 0.2, y: chaoY, vx: rand(-90, -40), vy: rand(-40, -10), vida: 0.6, max: 0.6, r: rand(3, 7), cor: '210,120,70' });
        }
    }

    function desenharPoeira(dt) {
        for (let i = poeira.length - 1; i >= 0; i--) {
            const p = poeira[i];
            p.x += p.vx * dt; p.y += p.vy * dt; p.vida -= dt;
            if (p.vida <= 0) { poeira.splice(i, 1); continue; }
            c.globalAlpha = (p.vida / p.max) * 0.6;
            c.fillStyle = `rgb(${p.cor})`;
            c.beginPath(); c.arc(p.x, p.y, p.r * (1.3 - p.vida / p.max * 0.5), 0, 6.2832); c.fill();
        }
        c.globalAlpha = 1;
        if (poeira.length > 300) poeira.splice(0, poeira.length - 300);
    }

    function vinheta() {
        const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.6)');
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
    }

    // ============ Viagem em hiperespaço, vista de dentro da cabine ============
    let modo = 'warp', warpV = 4, tSaida = -1, cabine = null;
    const CORES = ['255,255,255', '170,215,255', '255,200,140', '255,160,200'];
    const NEB = ['255,170,60', '90,200,255', '255,120,170', '150,90,255', '60,220,200'];
    const REDUZ = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sNova = ini => ({ x: rand(-1, 1), y: rand(-1, 1), z: ini ? rand(0.04, 1) : 1, c: CORES[(Math.random() * 4) | 0] });
    const bNova = ini => ({ x: rand(-1.4, 1.4), y: rand(-1.2, 1.2), z: ini ? rand(0.1, 1) : 1, r: rand(0.08, 0.22), c: NEB[(Math.random() * 5) | 0] });
    const ws = Array.from({ length: 300 }, () => sNova(true));
    const wb = Array.from({ length: 16 }, () => bNova(true));

    function desenharWarp(dt) {
        if (tSaida >= 0) { tSaida += dt; warpV = 1 + 8 * Math.pow(Math.min(1, tSaida / 0.8), 2); }      // salto de saída
        else warpV += ((REDUZ ? 0.4 : 1) - warpV) * Math.min(1, dt * 1.2);                               // desacelera ao entrar
        const cx = W / 2, cy = H * 0.38, k = Math.max(W, H) * 0.19;
        const sh = REDUZ ? 0 : Math.min(2.5, warpV * 0.8);
        c.save();
        c.translate(rand(-sh, sh), rand(-sh, sh));
        let g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#02030a'); g.addColorStop(1, '#0a0720');
        c.fillStyle = g; c.fillRect(-5, -5, W + 10, H + 10);
        c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 4; i++) {                       // nuvens de nebulosa ao fundo
            const a = tempo * 0.15 + i * 1.7, nx = cx + Math.cos(a) * W * 0.25, ny = cy + Math.sin(a * 1.3) * H * 0.18;
            g = c.createRadialGradient(nx, ny, 0, nx, ny, W * 0.35);
            g.addColorStop(0, 'rgba(' + NEB[(i * 2 + 1) % 5] + ',0.16)'); g.addColorStop(1, 'rgba(0,0,0,0)');
            c.fillStyle = g; c.fillRect(0, 0, W, H);
        }
        for (const b of wb) {                               // manchas coloridas passando
            b.z -= dt * 0.55 * warpV;
            if (b.z < 0.08) { Object.assign(b, bNova(false)); continue; }
            const sx = cx + b.x / b.z * k, sy = cy + b.y / b.z * k, r = b.r / b.z * k * 0.7;
            if (sx < -r || sx > W + r || sy < -r || sy > H + r) { if (b.z < 0.4) Object.assign(b, bNova(false)); continue; }
            g = c.createRadialGradient(sx, sy, 0, sx, sy, r);
            const al = Math.min(0.55, (1 - b.z) * 0.9);
            g.addColorStop(0, 'rgba(' + b.c + ',' + al + ')'); g.addColorStop(1, 'rgba(' + b.c + ',0)');
            c.fillStyle = g; c.beginPath(); c.arc(sx, sy, r, 0, 6.2832); c.fill();
        }
        c.lineCap = 'round';
        for (const s of ws) {                               // estrelas esticadas
            s.z -= dt * 0.9 * warpV;
            if (s.z < 0.03) { Object.assign(s, sNova(false)); continue; }
            const pz = Math.min(1.5, s.z + 0.02 + 0.035 * warpV);
            c.strokeStyle = 'rgba(' + s.c + ',' + Math.min(1, (1 - s.z) * 1.4) + ')';
            c.lineWidth = 0.6 + (1 - s.z) * 2.2;
            c.beginPath(); c.moveTo(cx + s.x / pz * k, cy + s.y / pz * k); c.lineTo(cx + s.x / s.z * k, cy + s.y / s.z * k); c.stroke();
        }
        c.globalCompositeOperation = 'source-over';
        c.restore();
        if (tSaida > 0.5) { c.fillStyle = 'rgba(255,255,255,' + Math.min(1, (tSaida - 0.5) / 0.4) + ')'; c.fillRect(0, 0, W, H); }
    }

    function montarCabine() {
        const o = document.createElement('canvas');
        o.width = cv.width; o.height = cv.height;
        const x = o.getContext('2d');
        x.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (!x.roundRect) x.roundRect = function (a, b, w, h) { this.rect(a, b, w, h); };
        const j = { x: W * 0.05, y: H * 0.07, w: W * 0.9, h: H * 0.62, r: Math.min(W, H) * 0.07 };
        const g = x.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#0d1118'); g.addColorStop(1, '#1b2231');
        x.fillStyle = g; x.beginPath(); x.rect(0, 0, W, H); x.roundRect(j.x, j.y, j.w, j.h, j.r); x.fill('evenodd');
        x.lineWidth = 5; x.strokeStyle = '#46546d'; x.beginPath(); x.roundRect(j.x, j.y, j.w, j.h, j.r); x.stroke();
        x.lineWidth = 2; x.strokeStyle = '#000'; x.beginPath(); x.roundRect(j.x + 5, j.y + 5, j.w - 10, j.h - 10, j.r); x.stroke();
        x.fillStyle = '#0a0d13'; x.lineWidth = 3; x.strokeStyle = '#46546d';
        for (const sd of [-1, 1]) {                         // vigas dos cantos
            const bx = sd < 0 ? j.x : j.x + j.w;
            x.beginPath(); x.moveTo(bx, j.y); x.lineTo(bx - sd * W * 0.17, j.y); x.lineTo(bx, j.y + H * 0.24); x.closePath(); x.fill(); x.stroke();
        }
        x.save(); x.beginPath(); x.roundRect(j.x, j.y, j.w, j.h, j.r); x.clip();       // reflexo do vidro
        const r = x.createLinearGradient(j.x, j.y, j.x + j.w * 0.5, j.y + j.h);
        r.addColorStop(0, 'rgba(255,255,255,0.07)'); r.addColorStop(0.35, 'rgba(255,255,255,0)');
        x.fillStyle = r; x.fillRect(j.x, j.y, j.w, j.h); x.restore();
        const py = j.y + j.h, ph = Math.max(20, H - py - 56);
        x.fillStyle = '#05070b'; x.fillRect(0, py + 8, W, 3);
        x.fillStyle = '#2a3446';
        for (let px = 30; px < W; px += 46) { x.beginPath(); x.arc(px, py + 22, 2.5, 0, 6.2832); x.fill(); }
        for (const ax of [W * 0.07, W * 0.69]) {            // telas do painel
            x.fillStyle = '#04080e'; x.strokeStyle = '#46546d'; x.lineWidth = 3;
            x.beginPath(); x.roundRect(ax, py + 40, W * 0.24, ph, 8); x.fill(); x.stroke();
        }
        return { cv: o, py };
    }

    function desenharCabine() {
        if (!cabine) cabine = montarCabine();
        c.drawImage(cabine.cv, 0, 0, W, H);
        const py = cabine.py, ph = Math.max(20, H - py - 56), fs = Math.max(8, Math.min(15, W * 0.011));
        const lx = W * 0.07, rx = W * 0.69, aw = W * 0.24, ty = py + 40;
        for (let i = 0; i < 14; i++) {                      // equalizador
            const h = (0.25 + 0.75 * Math.abs(Math.sin(tempo * 3 + i * 0.9))) * ph * 0.7 * Math.min(1, warpV / 3 + 0.35);
            c.fillStyle = i > 10 ? '#ff8d8d' : '#5eead4';
            c.fillRect(lx + 12 + i * (aw - 24) / 14, ty + ph - 8 - h, (aw - 24) / 14 - 3, h);
        }
        const rcx = rx + aw / 2, rcy = ty + ph / 2, rr = Math.min(aw, ph) * 0.42;     // radar
        c.strokeStyle = 'rgba(94,234,212,0.5)'; c.lineWidth = 1.5;
        c.beginPath(); c.arc(rcx, rcy, rr, 0, 6.2832); c.moveTo(rcx - rr, rcy); c.lineTo(rcx + rr, rcy); c.moveTo(rcx, rcy - rr); c.lineTo(rcx, rcy + rr); c.stroke();
        c.beginPath(); c.arc(rcx, rcy, rr * 0.5, 0, 6.2832); c.stroke();
        const a = tempo * 2.4;
        c.strokeStyle = '#5eead4'; c.lineWidth = 2; c.beginPath(); c.moveTo(rcx, rcy); c.lineTo(rcx + Math.cos(a) * rr, rcy + Math.sin(a) * rr); c.stroke();
        c.fillStyle = '#ffd166'; c.fillRect(rcx + Math.cos(tempo * 0.7) * rr * 0.6, rcy + Math.sin(tempo * 0.9) * rr * 0.5, 4, 4);
        c.textAlign = 'center'; c.font = fs + 'px "Press Start 2P", monospace';       // velocímetro
        c.fillStyle = '#8793a0'; c.fillText('VELOCIDADE', W / 2, ty + fs * 1.6);
        c.font = (fs * 2) + 'px "Press Start 2P", monospace';
        c.fillStyle = '#ffffff'; c.fillText((0.62 + warpV * 0.09).toFixed(2) + ' c', W / 2, ty + fs * 4.6);
        for (let i = -1; i <= 1; i++) { c.fillStyle = Math.sin(tempo * 4 + i * 2) > 0 ? '#e0284d' : '#3a1118'; c.beginPath(); c.arc(W / 2 + i * 36, ty + ph - 14, 5, 0, 6.2832); c.fill(); }
        c.textAlign = 'left';
    }

    function quadro(agora) {
        if (!rodando) return;
        const dt = Math.min(0.05, (agora - ultimo) / 1000);
        ultimo = agora;
        tempo += dt;

        if (!cenarioMascarado && Assets.ok(Assets.img.cenarioFase1)) prepararMarte();

        if (modo === 'warp') { desenharWarp(dt); desenharCabine(); }
        else {
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
        cv.style.display = 'block';
        redimensionar();
        ultimo = performance.now();
        raf = requestAnimationFrame(quadro);
    }

    function parar() {
        rodando = false;
        cancelAnimationFrame(raf);
        cv.style.display = 'none';
    }

    window.addEventListener('resize', () => { if (rodando) redimensionar(); });

    return { iniciar, parar, saida() { tSaida = 0; }, reiniciarEntrada() { tempo = 0; tSaida = -1; warpV = 4; pulo = { ativo: false, t: 0, proximo: 4.5 }; } };
})();
