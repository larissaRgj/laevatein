export class EnemyMovement {
    static update(enemy, player, groundY) {
        enemy.direction = -1;
        const variation = 1 + Math.sin(enemy.fase * 2.4) * 0.08;
        enemy.x += enemy.direction * enemy.vel * variation;

        if (enemy.baseY !== undefined) {
            const hover = Math.sin(enemy.fase * 1.4) * (enemy.amp || 14);
            const targetY = Math.max(groundY - enemy.h - 250, Math.min(groundY - enemy.h - 12, player.y + hover));
            enemy.y += (targetY - enemy.y) * 0.025;
        } else {
            enemy.y = groundY - enemy.h;
        }
    }
}
