import * as PIXI from "pixi.js";
import assetLoader from "./assetLoader.js";
import Keyboard from "pixi.js-keyboard";
import Mouse from "pixi.js-mouse";
import { GameplayState } from "./gameStates/gameplayState.js";
import { logService, LogLevel } from "./logService.js";

// In the future, map data and game state data should be pulled from the server, for testing
// we will use hard-coded JSON test data instead
import testGameState from "./game_data/gameStateTEST.json";
import japanMap from "../../public/dist/maps/japan_tconfig.json";

const loader = PIXI.Loader.shared;

PIXI.utils.sayHello("WebGL");
PIXI.settings.RESOLUTION = 1.0;

// Initialization
let app = new PIXI.Application({ width: 800, height: 608, backgroundColor: 0x000000 });
document.body.appendChild(app.view);

// Load all assets from game_data/* files
assetLoader.initialize(loader, main);

function main() {
    logService(LogLevel.INFO, "initializing application");

    // For production, this will be another level above for managing overall game state
    // For testing we will jump straight into gameplay with fake data imported above
    logService(LogLevel.WARNING, "running in DEV mode");
    let testState = new GameplayState(app.stage, japanMap, testGameState);

    app.ticker.add((delta) => {
        Keyboard.update();
        Mouse.update();

        testState.update(delta);
    });
}
