export class SpriteAnimator {
    static draw(ctx, image, frame, x, y, width, height, frameWidth, frameHeight, columns) {
        if (!image || !image.complete || !image.naturalWidth) return false;
        const totalFrames = Math.floor(image.naturalWidth / frameWidth) * Math.floor(image.naturalHeight / frameHeight);
        if (!totalFrames) return false;
        const index = ((Math.floor(frame) % totalFrames) + totalFrames) % totalFrames;
        const sourceX = (index % columns) * frameWidth;
        const sourceY = Math.floor(index / columns) * frameHeight;
        ctx.drawImage(image, sourceX, sourceY, frameWidth, frameHeight, x, y, width, height);
        return true;
    }
}
