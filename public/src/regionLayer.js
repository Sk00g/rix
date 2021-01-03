import * as PIXI from "pixi.js";
import * as V from "./vector.js";
import graphics from "./game_data/graphics.js";
import assetLoader from "./assetLoader.js";

const DEFAULT_REGION_COLOR = 0xffffff;
const DEFAULT_REGION_ALPHA = 0.1;
const BLIP_SCALE = 1.25;

class Region {
    constructor(mapData, data, stage, tileScale) {
        this._stage = stage;
        this._tileScale = tileScale;

        // Data from the actual map file is considered 'static' because it can't change after init
        this._static = { ...data };

        this._blipSprites = [];
        this._shadePath = [];
        for (let i = 0; i < data.borderTiles.length; i++) {
            let tile = data.borderTiles[i];
            let blip = new PIXI.Sprite(assetLoader.loadTexture(graphics.interface.blip_white));
            blip.scale.set(BLIP_SCALE, BLIP_SCALE);
            let blipX = mapData.tileSize[0] * tileScale * tile[0];
            let blipY = mapData.tileSize[1] * tileScale * tile[1];
            this._shadePath.push(
                blipX + (mapData.tileSize[0] * BLIP_SCALE) / 2,
                blipY + (mapData.tileSize[0] * BLIP_SCALE) / 2
            );
            blip.position.set(blipX, blipY);
            stage.addChild(blip);
            this._blipSprites.push(blip);
        }

        this._fillColor = DEFAULT_REGION_COLOR;
        this._fillAlpha = DEFAULT_REGION_ALPHA;
        this._shape = null;

        this._render();
    }

    getHitPath() {
        return this._blipSprites.map((sprite) => [sprite.position.x, sprite.position.y]);
    }

    setStyle(style) {
        if ("fillColor" in style) this._fillColor = style.fillColor;
        if ("fillAlpha" in style) this._fillAlpha = style.fillAlpha;

        // All blips are the same, so only compare to the first
        if ("outlineAlpha" in style && this._blipSprites[0].alpha !== style.outlineAlpha)
            for (let blip of this._blipSprites) blip.alpha = style.outlineAlpha;
        if ("outlineColor" in style && this._blipSprites[0].tint !== style.outlineColor)
            for (let blip of this._blipSprites) blip.tint = style.outlineColor;

        this._render();
    }

    getUnitCenter() {
        return [this._static.unitPoint[0], this._static.unitPoint[1]];
    }

    _render() {
        if (this._shape) this._stage.removeChild(this._shape);

        this._shape = new PIXI.Graphics();
        this._shape.lineStyle(this._outlineWidth, this._outlineColor, this._outlineAlpha);
        this._shape.beginFill(this._fillColor, this._fillAlpha);
        this._shape.drawPolygon(this._shadePath);
        this._shape.endFill();

        // this._shape.position.set(this._static.position[0], this._static.position[1]);

        this._stage.addChild(this._shape);
    }
}

class RegionLayer {
    constructor(stage, mapData, tileScale) {
        this._staticData = { ...mapData };
        this._stage = stage;
        this._regions = {};

        for (let data of mapData.regions) {
            this._regions[data.name] = new Region(mapData, data, stage, tileScale);
        }

        // Set the continent colors for each region
        for (let cont of mapData.continents) {
            for (let name of cont.regions)
                this._regions[name].setStyle({
                    outlineColor: parseInt(cont.color.substr(1), 16),
                    fillColor: parseInt(cont.color.substr(1), 16),
                });
        }

        this._eventHandlers = {
            mouseEnter: [], // handlers are passed the region that fired the event
            mouseExit: [], // handlers are passed the region that fired the event
        };
    }

    on(eventType, func) {
        this._eventHandlers[eventType].push(func);
    }

    get(name) {
        return this._regions[name];
    }

    update(delta, mousePos) {
        for (let key in this._regions) {
            let region = this._regions[key];
            if (V.isPointWithinPolygon(mousePos, region.getHitPath())) {
                if (!region.isHovering)
                    for (let handler in this._eventHandlers.mouseEnter) handler(region);

                region.isHovering = true;
            } else {
                if (region.isHovering)
                    for (let handler in this._eventHandlers.mouseExit) handler(region);
                region.isHovering = false;
            }
        }
    }
}

export default RegionLayer;
