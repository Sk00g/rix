import * as PIXI from "pixi.js";
import SUIE from "./sengine/suie/suie.js";
import utils from "./sengine/utils.js";
import assetLoader from "./assetLoader.js";
import Keyboard from "pixi.js-keyboard";
import Mouse from "pixi.js-mouse";
import TileMap from "./tilemap.js";
import RegionLayer from "./regionLayer.js";
import UnitAvatar from "./sengine/unitAvatar.js";
import japanMap from "../../public/dist/maps/japan_tconfig.json";
import graphics from "./game_data/graphics.js";
import { logService, LogLevel } from "./logService.js";

const loader = PIXI.Loader.shared;

PIXI.utils.sayHello("WebGL");
PIXI.settings.RESOLUTION = 1.0;

// Initialization
let app = new PIXI.Application({ width: 800, height: 608, backgroundColor: 0x000000 });
document.body.appendChild(app.view);

// Load all assets from game_data/* files
assetLoader.initialize(loader, main);

let dancers = [];
let regionLayer = null;
let tileMap = null;
function main() {
    logService(LogLevel.INFO, "initializing application");

    tileMap = new TileMap(app.stage, japanMap, 2.0);
    regionLayer = new RegionLayer(app.stage, japanMap);

    let bard = new UnitAvatar(app.stage, graphics.avatar.bard, true);
    bard.setPosition(regionLayer.get("SJ-1").getCenter());
    dancers.push(bard);

    let exec = new UnitAvatar(app.stage, graphics.avatar.exec);
    exec.setPosition(regionLayer.get("SJ-2").getCenter());
    dancers.push(exec);

    let ghost = new UnitAvatar(app.stage, graphics.avatar.ghost);
    ghost.setPosition(regionLayer.get("SEJ-1").getCenter());
    dancers.push(ghost);

    Keyboard.events.on("released", (keyCode, event) => {
        if (keyCode === "KeyA") {
            for (let human of dancers) {
                human.playWalkAnimation();
            }
        }
    });

    // let conductor = new Conductor();
    // conductor.playExecuteAttackSequence(attacker, defender, battleOutcome)
    // conductor.playMoveUnit(unit, region)
    // conductor.playDeploy(region, amount)

    app.ticker.add(gameLoop);
}

function gameLoop(delta) {
    Keyboard.update();
    Mouse.update();

    regionLayer.update(delta, [Mouse.posLocalX, Mouse.posLocalY]);
    dancers.forEach((human) => human.update(delta));
}
