import * as PIXI from "pixi.js";
import * as V from "./vector.js";
import Mouse from "pixi.js-mouse";
import graphics from "./game_data/graphics.js";
import assetLoader from "./assetLoader.js";

const DEFAULT_REGION_COLOR = 0xffffff;
const DEFAULT_REGION_ALPHA = 0.3;
const DEFAULT_OUTLINE_ALPHA = 1.0;
const DEFAULT_OUTLINE_WIDTH = 2;
const BLIP_SCALE = 1.25;

class RegionVisual {
    constructor(mapData, data, stage) {
        this._stage = stage;
        this._tileScale = mapData.scale;
        this._spriteContainer = new PIXI.Container();

        // Data from the actual map file is considered 'static' because it can't change after init
        this._static = { ...data };

        // Public access properties
        this.name = data.name;

        this._blipSprites = [];
        this._shadePath = [];
        for (let i = 0; i < data.borderTiles.length; i++) {
            let tile = data.borderTiles[i];
            let blip = new PIXI.Sprite(assetLoader.loadTexture(graphics.interface.blip_white));
            blip.scale.set(BLIP_SCALE, BLIP_SCALE);
            let blipX = mapData.tileSize[0] * this._tileScale * tile[0];
            let blipY = mapData.tileSize[1] * this._tileScale * tile[1];
            this._shadePath.push(
                blipX + (mapData.tileSize[0] * BLIP_SCALE) / 2,
                blipY + (mapData.tileSize[0] * BLIP_SCALE) / 2
            );
            blip.position.set(blipX, blipY);
            blip.alpha = 0;
            this._spriteContainer.addChild(blip);
            this._blipSprites.push(blip);
        }

        this._fillColor = DEFAULT_REGION_COLOR;
        this._fillAlpha = DEFAULT_REGION_ALPHA;
        this._outlineWidth = DEFAULT_OUTLINE_WIDTH;
        this._outlineColor = DEFAULT_REGION_COLOR;
        this._shape = null;

        stage.addChild(this._spriteContainer);

        this._render();
    }

    getHitPath() {
        return this._blipSprites.map((sprite) => [
            sprite.position.x + sprite.width / 2,
            sprite.position.y + sprite.height / 2,
        ]);
    }

    resetStyle() {
        this.setStyle(this._defaultStyle);
    }

    setStyle(style) {
        if ("fillColor" in style) {
            this._fillColor = style.fillColor;
            this._outlineColor = style.fillColor;
        }
        if ("fillAlpha" in style) this._fillAlpha = style.fillAlpha;

        // All blips are the same, so only compare to the first
        if ("outlineAlpha" in style && this._blipSprites[0].alpha !== style.outlineAlpha)
            for (let blip of this._blipSprites) blip.alpha = 0;
        // for (let blip of this._blipSprites) blip.alpha = style.outlineAlpha;
        if ("outlineColor" in style && this._blipSprites[0].tint !== style.outlineColor)
            for (let blip of this._blipSprites) blip.tint = style.outlineColor;

        this._render();
    }

    getUnitCenter() {
        return [this._static.unitPoint[0], this._static.unitPoint[1]];
    }

    _render() {
        if (this._shape) this._spriteContainer.removeChild(this._shape);

        this._shape = new PIXI.Graphics();
        this._shape.lineStyle(this._outlineWidth, this._outlineColor, this._outlineAlpha);
        this._shape.beginFill(this._fillColor, this._fillAlpha);
        this._shape.drawPolygon(this._shadePath);
        this._shape.endFill();

        // this._shape.position.set(this._static.position[0], this._static.position[1]);

        this._spriteContainer.addChild(this._shape);
    }
}

class RegionLayer {
    constructor(stage, mapData, tileScale) {
        this._staticData = { ...mapData };
        this._stage = stage;
        this._regions = {};

        for (let data of mapData.regions) {
            this._regions[data.name] = new RegionVisual(mapData, data, stage, tileScale);
        }

        // Set the continent colors for each region
        for (let cont of mapData.continents) {
            for (let name of cont.regions) {
                this._regions[name]._defaultStyle = {
                    outlineColor: parseInt(cont.color.substr(1), 16),
                    outlineAlpha: DEFAULT_OUTLINE_ALPHA,
                    fillColor: parseInt(cont.color.substr(1), 16),
                    fillAlpha: DEFAULT_REGION_ALPHA,
                };
            }
        }

        this.clearAllStyles();

        this._eventHandlerUID = 100;
        this._handlerRegistry = {};
        this._objectKeyRegistry = {};
        // All handlers are passed the region that fired the event
        this._eventHandlers = {
            mouseEnter: [],
            mouseExit: [],
            leftClick: [],
            rightClick: [],
        };

        // Setup click handler
        this._setupClickHandler();
    }

    _setupClickHandler() {
        Mouse.events.on("released", (code, event, x, y) => {
            for (let key in this._regions) {
                let region = this._regions[key];
                if (V.isPointWithinPolygon([x, y], region.getHitPath())) {
                    let eventType = code === 0 ? "leftClick" : "rightClick";
                    for (let handler of this._eventHandlers[eventType]) handler(region);
                }
            }
        });
    }

    on(eventType, func, objectKey = null) {
        this._eventHandlers[eventType].push(func);

        // Use simple UID registry for optional unsubscribing
        this._eventHandlerUID++;
        this._handlerRegistry[this._eventHandlerUID] = func;

        // ObjectKey based registry for simple mass unsubscribing
        if (objectKey) {
            if (!(objectKey in this._objectKeyRegistry)) this._objectKeyRegistry[objectKey] = [];
            this._objectKeyRegistry[objectKey].push([eventType, func]);
        }

        return this._eventHandlerUID;
    }

    removeHandler(eventType, uid) {
        if (!(eventType in this._eventHandlers) || !(uid in this._handlerRegistry))
            throw new Exception(`Specified handler ${eventType} (${uid}) doesn't exist`);

        this._eventHandlers[eventType].splice(
            this._eventHandlers[eventType].indexOf(this._handlerRegistry[uid]),
            1
        );
    }

    unsubscribeAll(objectKey) {
        if (!(objectKey in this._objectKeyRegistry)) {
            // throw new Error(`objectKey ${objectKey} not in event registry`);
            console.warn(`objectKey ${objectKey} is not in registry`);
            return;
        }

        for (let entry of this._objectKeyRegistry[objectKey]) {
            this._eventHandlers[entry[0]].splice(
                this._eventHandlers[entry[0]].indexOf(entry[1]),
                1
            );
        }
        delete this._objectKeyRegistry[objectKey];
    }

    get(name) {
        return this._regions[name];
    }

    clearAllStyles() {
        for (let key in this._regions) {
            this._regions[key].resetStyle();
        }
    }

    update(delta, mousePos) {
        for (let key in this._regions) {
            let region = this._regions[key];
            if (V.isPointWithinPolygon(mousePos, region.getHitPath())) {
                if (!region.isHovering)
                    for (let handler of this._eventHandlers.mouseEnter) handler(region);
                region.isHovering = true;
            } else {
                if (region.isHovering)
                    for (let handler of this._eventHandlers.mouseExit) handler(region);
                region.isHovering = false;
            }
        }
    }
}

export default RegionLayer;
