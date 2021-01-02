import * as PIXI from "pixi.js";

// Class used for displaying tilemap
class TileMap {
    constructor(stage, mapData, scale) {
        const path = mapData.tilesetPath;
        const size = mapData.tileMapSize;

        this._tileSize = mapData.tileSize;
        this._tileIndices = [];
        this._tileSprites = [];

        for (let x = 0; x < size[0]; x++) {
            this._tileIndices[x] = [];
            this._tileSprites[x] = [];
            for (let y = 0; y < size[1]; y++) {
                let texture = new PIXI.Texture(PIXI.BaseTexture.from(path));
                let sprite = new PIXI.Sprite(texture);

                sprite.position.set(x * this._tileSize[0] * scale, y * this._tileSize[1] * scale);
                sprite.scale.set(scale, scale);

                this._tileSprites[x][y] = sprite;

                this.updateTileIndex(x, y, Math.floor(Math.random() * 3), 0);

                stage.addChild(sprite);
            }
        }
    }

    updateTileIndex(tileX, tileY, indexX, indexY) {
        this._tileIndices[tileX][tileY] = [indexX, indexY];
        this._tileSprites[tileX][tileY].texture.frame = new PIXI.Rectangle(
            indexX * this._tileSize[0],
            indexY * this._tileSize[1],
            this._tileSize[0],
            this._tileSize[1]
        );
    }

    exportToDataFile(fileName) {
        // collect all internal variables into a single data object
        // convert said object into text (let text = JSON.stringify(data))
        // download said text to the browser-user's computer
    }
}

export default TileMap;
