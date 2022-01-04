import * as PIXI from "pixi.js";
import { logService, LogLevel } from "./logService.js";
import graphics from "./game_data/graphics.js";

function initialize(loader: PIXI.Loader, callback: any): void {
    let loadCount = 0;
    let totalAssets = 0;
    let imagePaths: any[] = [];

    loader.onProgress.add((loader, resource) => {
        loadCount++;
        if (resource.error) {
            logService(LogLevel.ERROR, `asset loading error: ${resource.error}`, "ASSET");
        } else {
            logService(
                LogLevel.DEBUG,
                `[${loadCount} of ${totalAssets} (${Math.round(loader.progress)}%)] - LOADED ${resource.url}`,
                "ASSET"
            );
        }

        if (loadCount === totalAssets) logService(LogLevel.INFO, "asset loading complete", "ASSET");
    });

    for (let category of graphics.categories) {
        totalAssets += Object.keys(graphics[category]).length;
        imagePaths.push(...Object.keys(graphics[category]).map((key) => graphics[category][key]));
    }

    loader.add(imagePaths).load(callback);
}

function loadTexture(path: string): PIXI.Texture {
    return new PIXI.Texture(PIXI.BaseTexture.from(path));
}

export default {
    initialize,
    loadTexture,
};
