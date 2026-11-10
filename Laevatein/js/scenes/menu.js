/* ============================================================
   menu.js  —  fluxo das telas: Projeto Frontend → Lævatein → jogo
   ============================================================ */
'use strict';

import { Assets, Som } from '../core/assets.js';
import { Intro } from './intro.js';

const textoProjeto = document.getElementById('textProjeto');
const subtituloProjeto = document.getElementById('subtitleProjeto');
const botaoProjeto = document.getElementById('buttonProjeto');
const menuProj = document.getElementById('menuProj');
const menuGame = document.getElementById('menuGame');
const botaoGame = document.getElementById('buttonGame');
const containerGame = document.getElementById('containerGame');
const cortina = document.getElementById('cortina');
const recordeMenu = document.getElementById('recordeMenu');

let transicionando = false;
let iniciandoMenu = false;

function lerRecorde() {
    try { return parseInt(localStorage.getItem('laevatein_recorde'), 10) || 0; } catch (e) { return 0; }
}

window.voltarAoMenu = voltarAoMenu;

function atualizarRecordeMenu() {
    const r = lerRecorde();
    recordeMenu.textContent = r > 0 ? `RECORDE  ${String(r).padStart(7, '0')}` : '';
}

// Cena de abertura começa assim que as imagens estiverem prontas
Intro.iniciar();
Assets.pronto.then(() => {
    Intro.iniciar();                       // recalcula a paisagem já com a imagem carregada
    botaoProjeto.disabled = false;
    botaoProjeto.textContent = 'COMEÇAR';
});

botaoProjeto.addEventListener('click', () => {
    if (iniciandoMenu) return;
    iniciandoMenu = true;
    Som.desbloquear();
    Som.sfx('clique');
    textoProjeto.classList.add('introSaindo');
    subtituloProjeto.classList.add('introSaindo');
    botaoProjeto.classList.add('introSaindo');
    botaoProjeto.disabled = true;
    botaoProjeto.classList.add('preparando');
    botaoProjeto.textContent = 'PREPARANDO...';
    textoProjeto.innerText = 'PREPARE-SE, ASTRONAUTA';

    setTimeout(() => {
        menuProj.style.display = 'none';
        atualizarRecordeMenu();
        menuGame.classList.remove('oculto');
        setTimeout(() => menuGame.classList.add('ativo'), 100);
    }, 3000);
});

botaoGame.addEventListener('click', () => {
    if (transicionando) return;
    transicionando = true;
    Som.desbloquear();
    Som.sfx('clique');

    menuGame.classList.add('saindo');
    Intro.saida();                                   // salto: o warp acelera e estoura em branco
    setTimeout(() => cortina.classList.add('ativa'), 1000);

    setTimeout(() => {
        menuGame.style.display = 'none';
        Intro.parar();
        containerGame.classList.remove('oculto');
        window.iniciarJogo();
        setTimeout(() => {
            containerGame.classList.add('mostrarJogo');
            cortina.classList.remove('ativa');
            transicionando = false;
        }, 60);
    }, 1650);
});

// Chamado pelo jogo (botão "Menu" nos painéis)
function voltarAoMenu() {
    if (transicionando) return;
    transicionando = true;
    cortina.classList.add('ativa');

    setTimeout(() => {
        window.pararJogo();
        Som.parar();
        containerGame.classList.remove('mostrarJogo');
        containerGame.classList.add('oculto');

        Intro.reiniciarEntrada();
        Intro.iniciar();
        atualizarRecordeMenu();
        menuGame.style.display = '';
        menuGame.classList.remove('saindo');
        menuGame.classList.add('ativo');

        cortina.classList.remove('ativa');
        transicionando = false;
    }, 650);
}
