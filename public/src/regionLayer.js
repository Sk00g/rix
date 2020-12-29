import * as PIXI from "pixi.js";

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

const LINE_FILL = [1, 0x00ff00, 1]; // width, color, alpha
const REGION_COLOR = 0xff0000;
const REGION_ALPHA = 0.1;

class RegionLayer {
    constructor(stage, regionData) {
        this._regionData = regionData;

        for (let region of regionData) {
            let shape = new PIXI.Graphics();

            shape.lineStyle(LINE_FILL[0], LINE_FILL[1], LINE_FILL[2]);
            shape.beginFill(REGION_COLOR, REGION_ALPHA);
            shape.drawPolygon(region.path);
            shape.endFill();

            shape.position.set(region.position[0], region.position[1]);

            stage.addChild(shape);
        }
    }

    getRegionCenter(regionName) {
        let match = this._regionData.find((reg) => reg.name === regionName);
        if (!match) throw new Error("YOU SUCK!");
        return [match.position[0] + match.centerPoint[0], match.position[1] + match.centerPoint[1]];
    }
}

export default RegionLayer;
