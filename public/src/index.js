import * as PIXI from "pixi.js";
import SUIE from "./sengine/suie/suie.js";
import utils from "./sengine/utils.js";
import Keyboard from "pixi.js-keyboard";
import Mouse from "pixi.js-mouse";
import TileMap from "./tilemap.js";
import RegionLayer from "./regionLayer.js";
import UnitAvatar from "./sengine/unitAvatar.js";
import japanMap from "../../public/dist/maps/japan_tconfig.json";

const loader = PIXI.Loader.shared;

PIXI.utils.sayHello("WebGL");
PIXI.settings.RESOLUTION = 1.5;

// Initialization
let app = new PIXI.Application({ width: 800, height: 600, backgroundColor: 0x000000 });
document.body.appendChild(app.view);

// Load images into WebGL compatible format
let imagePaths = [
    "graphics/tilesets/grassBiome/overworld_tileset_grass.png",
    "graphics/ui/source/16x16/Set1/Set1-1.png",
    ...["bardo_1.png", "executioner_1.png", "knights_1x.png"].map(
        (path) => `graphics/characters/${path}`
    ),
];

let dancers = [];

loader.add(imagePaths).load(() => {
    let testMap = new TileMap(
        app.stage,
        japanMap.tilesetPath,
        japanMap.tileMapSize,
        japanMap.tileSize
    );

    const regionData = japanMap.regions;
    let regionLayer = new RegionLayer(app.stage, regionData);

    let bard = new UnitAvatar(app.stage, "graphics/characters/bardo_1.png");
    bard.setPosition(regionLayer.getRegionCenter("SJ-1"));
    dancers.push(bard);

    let exec = new UnitAvatar(app.stage, "graphics/characters/executioner_1.png");
    exec.setPosition(regionLayer.getRegionCenter("SJ-2"));
    dancers.push(exec);

    let knight = new UnitAvatar(app.stage, "graphics/characters/knights_1x.png");
    knight.setPosition(regionLayer.getRegionCenter("SJ-3"));
    dancers.push(knight);

    Keyboard.events.on("released", (keyCode, event) => {
        if (keyCode === "KeyA") {
            for (let human of dancers) {
                human.playWalkAnimation();
            }
        } else if (keyCode === "KeyB") {
            for (let human of dancers) {
                human.stopAnimation();
            }
        }
    });

    app.ticker.add(gameLoop);
});

function gameLoop(delta) {
    Keyboard.update();
    Mouse.update();

    dancers.forEach((human) => human.update(delta));
}
