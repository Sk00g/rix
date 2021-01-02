import * as PIXI from "pixi.js";
import * as V from "./vector.js";

/*
{
    "continent": "Southeast Japan",
    "hasCastle": false,
    "hasVillage": false,
    "polygon": [
        [25, 432],
        [26, 462]
    ]
}
*/

const LINE_FILL = [1, 0x8282f0, 0.8]; // width, color, alpha
const REGION_COLOR = 0xffffff;
const REGION_ALPHA = 0.05;

class Region {
    constructor(data, stage) {
        this._stage = stage;

        // Data from the actual map file is considered 'static' because it can't change after init
        this._static = { ...data };

        // PUBLICLY ACCESSIBLE BECAUSE THEY WOULD NEVER BE CHANGED ANYWAYS
        this.vertices = [];
        this.absoluteVertices = [];
        for (let i = 0; i < data.path.length; i += 2) {
            this.vertices.push([data.path[i], data.path[i + 1]]);
            this.absoluteVertices.push([
                data.path[i] + data.position[0],
                data.path[i + 1] + data.position[1],
            ]);
        }

        this._fillColor = REGION_COLOR;
        this._fillAlpha = REGION_ALPHA;
        this._outlineFill = LINE_FILL;
        this._shape = null;

        this._render();
    }

    setStyle(style) {
        if ("fillColor" in style) this._fillColor = style.fillColor;
        if ("fillAlpha" in style) this._fillAlpha = style.fillAlpha;
        if ("outline" in style) this._outlineFill = style.outline;

        this._render();
    }

    getCenter() {
        return [
            this._static.position[0] + this._static.centerPoint[0],
            this._static.position[1] + this._static.centerPoint[1],
        ];
    }

    _render() {
        if (this._shape) this._stage.removeChild(this._shape);

        this._shape = new PIXI.Graphics();

        this._shape.lineStyle(this._outlineFill[0], this._outlineFill[1], this._outlineFill[2]);
        this._shape.beginFill(this._fillColor, this._fillAlpha);
        this._shape.drawPolygon(this._static.path);
        this._shape.endFill();

        this._shape.position.set(this._static.position[0], this._static.position[1]);

        this._stage.addChild(this._shape);
    }
}

class RegionLayer {
    constructor(stage, regionData) {
        this._staticData = regionData;
        this._stage = stage;
        this._regions = {};

        for (let data of regionData) {
            this._regions[data.name] = new Region(data, stage);
        }
    }

    get(name) {
        return this._regions[name];
    }

    update(delta, mousePos) {
        for (let key in this._regions) {
            let region = this._regions[key];
            if (V.isPointWithinPolygon(mousePos, region.absoluteVertices)) {
                region.setStyle({ outline: [1, 0x8282f0, 1], fillAlpha: 0.1 });
            }
        }
    }
}

export default RegionLayer;
