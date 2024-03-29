import * as PIXI from "pixi.js";

// Class used for displaying tilemap
class TileMap {
    _tileSize: [number, number];
    _tileIndices: [number, number][][];
    _tileSprites: PIXI.Sprite[][];
    _scale: number;
    _spriteContainer: PIXI.Container;

    constructor(stage: PIXI.Container, mapData: any) {
        const path = mapData.tilesetPath;
        const size = mapData.tileMapSize;

        this._tileSize = mapData.tileSize;
        this._tileIndices = [];
        this._tileSprites = [];
        this._scale = mapData.scale;
        this._spriteContainer = new PIXI.Container();

        for (let x = 0; x < size[0]; x++) {
            this._tileIndices[x] = [];
            this._tileSprites[x] = [];
            for (let y = 0; y < size[1]; y++) {
                let texture = new PIXI.Texture(PIXI.BaseTexture.from(path));
                texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
                let sprite = new PIXI.Sprite(texture);

                sprite.position.set(x * this._tileSize[0] * this._scale, y * this._tileSize[1] * this._scale);
                sprite.scale.set(this._scale, this._scale);

                this._tileSprites[x][y] = sprite;

                this.updateTileIndex(x, y, mapData.tileIndices[x][y][0], mapData.tileIndices[x][y][1]);

                this._spriteContainer.addChild(sprite);
            }
        }

        stage.addChild(this._spriteContainer);
    }

    updateTileIndex(tileX: number, tileY: number, indexX: number, indexY: number) {
        this._tileIndices[tileX][tileY] = [indexX, indexY];
        this._tileSprites[tileX][tileY].texture.frame = new PIXI.Rectangle(
            indexX * this._tileSize[0],
            indexY * this._tileSize[1],
            this._tileSize[0],
            this._tileSize[1]
        );
    }
}

export default TileMap;
