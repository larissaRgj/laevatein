export class Ship {
    constructor({ x, y, targetY, width, height }) {
        this.x = x;
        this.y = y;
        this.targetY = targetY;
        this.w = width;
        this.h = height;
        this.estado = 'descendo';
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
        return centerX >= door.x
            && centerX <= door.x + door.w
            && centerY >= door.y
            && centerY <= door.y + door.h;
    }
}
