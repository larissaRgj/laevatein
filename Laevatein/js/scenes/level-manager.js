export const LEVELS = Object.freeze([
    Object.freeze({
        name: 'BASE ESPACIAL',
        background: 'cenarioFase1Jogo',
        enemyTypes: Object.freeze(['alien', 'guardiao']),
        boss: Object.freeze({ name: 'SENTINELA DA BASE', role: 'sentinel', sprite: 'sentinelaChefe', scale: 0.9, hue: 0 }),
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
        name: 'VALE DE PLASMA',
        background: 'cenarioFase2',
        enemyTypes: Object.freeze(['bruxa', 'cacadorPlasma']),
        boss: Object.freeze({ name: 'BRUXA DO NÚCLEO', role: 'witch', sprite: 'bruxaChefe', scale: 1.08, hue: 0 }),
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
        name: 'NÚCLEO DO REATOR',
        background: 'cenarioFase3',
        enemyTypes: Object.freeze(['worm', 'devorador']),
        boss: Object.freeze({
            name: 'MINHOCA DO NÚCLEO',
            role: 'worm',
            sprite: 'worm',
            scale: 1.04,
            hue: 0,
            forms: Object.freeze([
                Object.freeze({ sprite: 'worm', at: 1, widthScale: 1.5, heightScale: 0.68 }),
                Object.freeze({ sprite: 'chefe', at: 0.66, widthScale: 1.4, heightScale: 1.4 }),
                Object.freeze({ sprite: 'hidra', at: 0.33, widthScale: 1.9, heightScale: 1.55 })
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

export class LevelManager {
    static get(index) {
        const level = LEVELS[index];
        if (!level) throw new RangeError(`Fase inválida: ${index + 1}`);
        return level;
    }

    static background(index) {
        return this.get(index).background;
    }
}
