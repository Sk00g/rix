import * as PIXI from "pixi.js";
import SUIE from "./sengine/suie/suie.js";
import utils from "./sengine/utils.js";
import Keyboard from "pixi.js-keyboard";
import Mouse from "pixi.js-mouse";
import TileMap from "./tilemap.js";

const loader = PIXI.Loader.shared;

PIXI.utils.sayHello("WebGL");
PIXI.settings.RESOLUTION = 1.5;

// Initialization
let app = new PIXI.Application({ width: 800, height: 600, backgroundColor: 0xa0aaa0 });
document.body.appendChild(app.view);

// Load images into WebGL compatible format
let imagePaths = ["graphics/tilesets/grassBiome/overworld_tileset_grass.png"];

loader.add(imagePaths).load(() => {
    console.log("finished loading graphics");

    let testMap = new TileMap(
        app.stage,
        "graphics/tilesets/grassBiome/overworld_tileset_grass.png",
        [10, 10],
        [16, 16]
    );

    Keyboard.events.on("released", (keyCode, event) => {
        switch (keyCode) {
            case "KeyA":
                testMap.updateTileIndex(4, 4, 3, 3);
                break;
            case "KeyB":
                testMap.updateTileIndex(3, 3, 4, 4);
                break;
        }
    });

    app.ticker.add(gameLoop);
});

function gameLoop(delta) {
    Keyboard.update();
    Mouse.update();
}
