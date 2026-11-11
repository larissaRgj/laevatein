# Laevatein — Fuga de Marte

**Laevatein — Fuga de Marte** é um jogo de ação e plataformas 2D em pixel art, executado no navegador. Ajude um astronauta a escapar: atravesse três fases, derrote inimigos e chefes, reúna as chaves necessárias e embarque na nave.

[**Descarregar o jogo (ZIP)**](https://github.com/larissaRgj/laevatein/raw/refs/heads/main/LaevateinFinal.zip) · [Ver o código-fonte](https://github.com/larissaRgj/laevatein)

> O jogo está incluído no ZIP e pode ser executado localmente. Não é necessário instalar dependências npm para jogar. O repositório não configura atualmente uma página GitHub Pages; por isso, o link acima descarrega o jogo em vez de abrir uma versão alojada.

## Funcionalidades

- Três fases com cenários, inimigos e desafios distintos.
- Combate com tiros, saltos e jetpack; também é possível derrotar inimigos saltando sobre eles.
- Chefes com padrões de ataque próprios. O confronto final apresenta várias formas.
- Chaves para desbloquear os chefes, corações para recuperar vidas, pontuação e combos.
- Controlos por teclado, gamepad e botões tácteis.
- Ecrã de jogo em Canvas com resolução lógica de 1280 × 720, adaptada à janela.
- Recorde e preferência de som guardados localmente no navegador.

## Tecnologias

- **JavaScript ES2020**, em módulos ES, para a lógica, as cenas, a física, as colisões, os controlos e o áudio.
- **HTML5 Canvas** para o jogo e as animações.
- **HTML5 e CSS** para os menus, HUD, painéis e interface responsiva.
- **esbuild** para agrupar os módulos em `js/game.bundle.js`.
- **Node.js 18+** para o servidor local e para reconstruir o bundle; **Python 3** é uma alternativa para servir os ficheiros estáticos.

Durante o jogo, não há dependências npm necessárias: o bundle já está incluído. A fonte Press Start 2P é carregada do Google Fonts; sem ligação à Internet, é usada uma fonte alternativa.

## Requisitos

- Navegador moderno com suporte para Canvas, JavaScript ES2020 e áudio HTML5.
- Para o servidor incluído: Node.js 18 ou superior. Em alternativa, Python 3.
- Para desenvolvimento/build: Node.js 18+, npm e acesso ao registo npm para instalar o esbuild.

## Descarregar e executar

### Opção A — descarregar o ZIP

1. [Descarregue o jogo](https://github.com/larissaRgj/laevatein/raw/refs/heads/main/LaevateinFinal.zip) e extraia o arquivo por completo.
2. Abra a pasta `Laevatein` extraída. Mantenha `assets/`, `css/`, `js/` e `index.html` juntos.
3. Inicie um servidor local a partir dessa pasta, seguindo uma das opções abaixo. Recomenda-se HTTP em vez de abrir `index.html` diretamente.

### Opção B — clonar o repositório

```bash
git clone https://github.com/larissaRgj/laevatein.git
cd laevatein/Laevatein
```

### Iniciar o servidor local

Com Node.js 18 ou superior:

```bash
node js/local-server.js
```

Abra o endereço indicado no terminal (normalmente `http://127.0.0.1:8765/`). O servidor tenta usar portas seguintes se a 8765 estiver ocupada. No Windows, poderá abrir o navegador automaticamente. Mantenha o terminal aberto durante o jogo e pare o servidor com `Ctrl+C`.

Em alternativa, com Python 3:

```bash
python -m http.server 8765 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8765/`. No Windows, também pode usar `py -3 -m http.server 8765 --bind 127.0.0.1`. Pare o servidor com `Ctrl+C`.

No Windows, `Iniciar-Jogo.bat` inicia o servidor com Node.js ou, se não estiver disponível, tenta usar Python através do comando `py`.

## Controlos e jogabilidade

| Ação | Teclado | Ecrã táctil |
| --- | --- | --- |
| Mover | `←` / `→` ou `A` / `D` | Botões `◀` / `▶` |
| Saltar | `↑` ou `W` | Botão `▲` |
| Usar o jetpack no ar | Manter `↑` / `W` ou `Shift` | Manter `▲` |
| Acelerar | `Shift` | — |
| Disparar | `Espaço`, `Z`, `J` ou `K` | Botão `●` |
| Pausar / continuar | `P` ou `Esc` | Botão de pausa |
| Som ligado/desligado | `M` | Botão de som |
| Interagir com a nave | `E` ou caminhar até à porta | Caminhar até à porta |

Um gamepad compatível com a API Gamepad do navegador também é suportado. Em dispositivos móveis, jogue na orientação paisagem.

### Objetivo

Em cada fase, elimine o número de inimigos indicado e recolha três chaves para desbloquear o chefe. Salte sobre os inimigos ou use os disparos. Recolha corações para recuperar vidas. Depois de derrotar o chefe final, caminhe até à porta da nave para concluir a fuga.

## Reconstruir o bundle (opcional)

Só precisa de reconstruir o bundle se alterar os módulos-fonte em `js/`:

```bash
npm ci
npm run build
```

O comando actualiza `js/game.bundle.js`. O Node.js 18+ e o npm são necessários. Inclua o bundle actualizado no commit para que o jogo continue pronto a executar no navegador.

## Estrutura do projecto

```text
Laevatein/
├── assets/
│   ├── audio/          Músicas e efeitos sonoros
│   ├── images/         Sprites, fundos, chefes e elementos do cenário
│   └── reference/      Referências e artes originais
├── css/style.css       Estilos, menus e interface responsiva
├── js/
│   ├── core/           Recursos, áudio, entrada e estados
│   ├── entities/       Nave e movimento dos inimigos
│   ├── scenes/         Abertura, menu, fases e lógica do jogo
│   ├── utils/          Animação de sprites
│   ├── main.js         Entrada dos módulos-fonte
│   ├── game.bundle.js  Bundle pronto para o navegador
│   └── local-server.js Servidor HTTP local
├── index.html          Página e elementos da interface
├── Iniciar-Jogo.bat    Atalho de inicialização para Windows
├── package.json        Script de build e dependência de desenvolvimento
├── package-lock.json   Versões bloqueadas para instalação reproduzível
└── LEIA-ME.txt         Instruções em português
```

## Desenvolvimento e limitações conhecidas

- Não há actualmente testes automatizados nem comandos de lint configurados.
- `js/game.bundle.js` é gerado a partir dos módulos em `js/` com esbuild.
- `node_modules/` está presente no histórico do repositório. O `.gitignore` impede novas inclusões, mas os ficheiros já rastreados pelo Git precisam de ser removidos do índice para deixarem de ser versionados.
- A tipografia Press Start 2P depende do Google Fonts; a indisponibilidade do serviço não impede o jogo.
