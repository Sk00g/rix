import * as PIXI from "pixi.js";
import * as V from "./vector.js";

const DEFAULT_REGION_COLOR = 0xffffff;
const DEFAULT_REGION_ALPHA = 0.05;

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

        this._fillColor = DEFAULT_REGION_COLOR;
        this._fillAlpha = DEFAULT_REGION_ALPHA;
        this._outlineWidth = 1;
        this._outlineColor = 0x0000ff;
        this._outlineAlpha = 0.8;
        this._shape = null;

        this._render();
    }

    setStyle(style) {
        if ("fillColor" in style) this._fillColor = style.fillColor;
        if ("fillAlpha" in style) this._fillAlpha = style.fillAlpha;
        if ("outlineWidth" in style) this._outlineWidth = style.outlineWidth;
        if ("outlineColor" in style) this._outlineColor = style.outlineColor;
        if ("outlineAlpha" in style) this._outlineAlpha = style.outlineAlpha;

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
        console.log(this._outlineColor);
        this._shape.lineStyle(this._outlineWidth, this._outlineColor, this._outlineAlpha);
        this._shape.beginFill(this._fillColor, this._fillAlpha);
        this._shape.drawPolygon(this._static.path);
        this._shape.endFill();

        this._shape.position.set(this._static.position[0], this._static.position[1]);

        this._stage.addChild(this._shape);
    }
}

class RegionLayer {
    constructor(stage, mapData) {
        this._staticData = { ...mapData };
        this._stage = stage;
        this._regions = {};

        for (let data of mapData.regions) {
            this._regions[data.name] = new Region(data, stage);
        }

        // Set the continent colors for each region
        for (let cont of mapData.continents) {
            for (let name of cont.regions)
                this._regions[name].setStyle({
                    outlineColor: parseInt(cont.outlineColor.substr(1), 16),
                });
        }
    }

    get(name) {
        return this._regions[name];
    }

    update(delta, mousePos) {
        for (let key in this._regions) {
            let region = this._regions[key];
            if (V.isPointWithinPolygon(mousePos, region.absoluteVertices)) {
                // region.setStyle({ outlineColor: 0x8282f0, outlineAlpha: 0.1 });
            }
        }
    }
}

export default RegionLayer;
