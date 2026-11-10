const GAME_KEYS = new Set([
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space',
    'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyZ', 'KeyJ', 'KeyK',
    'KeyE', 'ShiftLeft', 'ShiftRight'
]);

export class InputHandler {
    constructor(target = window) {
        this.target = target;
        this.keys = Object.create(null);
        this.enabled = () => false;
        this.actions = {};
        this.target.addEventListener('keydown', event => this.handleKeyDown(event));
        this.target.addEventListener('keyup', event => { this.keys[event.code] = false; });
        this.target.addEventListener('blur', () => {
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
        if (event.code === 'KeyM') { this.actions.onMute?.(); return; }
        if (event.code === 'KeyP' || event.code === 'Escape') { this.actions.onPause?.(); return; }
        if (event.code === 'KeyE') { this.actions.onInteract?.(); return; }
        if ((event.code === 'Enter' || event.code === 'NumpadEnter') && this.actions.onConfirm?.()) return;
        if (event.code === 'KeyR' && this.actions.onRestart?.()) return;
        if (!event.repeat && (event.code === 'ArrowUp' || event.code === 'KeyW')) this.actions.onJump?.();
        this.keys[event.code] = true;
    }
}
