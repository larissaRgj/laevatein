export class StateMachine {
    constructor(initialState, transitions) {
        this.value = initialState;
        this.transitions = transitions;
    }

    transition(nextState) {
        if (nextState === this.value) return this.value;
        const allowed = this.transitions[this.value] || [];
        if (!allowed.includes(nextState)) {
            throw new Error(`Transição inválida: ${this.value} -> ${nextState}`);
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
}

export const AppState = new StateMachine('MENU', {
    MENU: ['PLAYING'],
    PLAYING: ['PAUSED', 'GAME_OVER', 'MENU'],
    PAUSED: ['PLAYING', 'MENU'],
    GAME_OVER: ['PLAYING', 'MENU']
});
