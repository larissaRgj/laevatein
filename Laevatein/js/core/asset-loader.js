export class AssetLoader {
    static async loadImages(manifest) {
        const entries = Object.entries(manifest);
        const results = await Promise.all(entries.map(([name, src]) => new Promise(resolve => {
            const image = new Image();
            image.onload = () => resolve([name, image]);
            image.onerror = () => {
                console.error(`Não foi possível carregar a imagem "${src}" (${name}).`);
                resolve([name, image]);
            };
            image.src = src;
        })));
        return Object.fromEntries(results);
    }

    static loadAudio(src) {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = src;
        audio.load();
        return audio;
    }
}
