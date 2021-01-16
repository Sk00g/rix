import * as PIXI from "pixi.js";
import SUIE from "./sengine/suie/suie.js";
import assetLoader from "./assetLoader.js";
import Keyboard from "pixi.js-keyboard";
import Mouse from "pixi.js-mouse";
import { GameplayState } from "./gameStates/gameplayState.js";
import { logService, LogLevel } from "./logService.js";
import AppContext from "./appContext.js";

// In the future, map data and game state data should be pulled from the server, for testing
// we will use hard-coded JSON test data instead
import testGameState from "./game_data/gameStateTEST.json";
import japanMap from "../../public/dist/maps/japan_tconfig.json";

// Universally get rid of default right-click behaviour
document.addEventListener("contextmenu", (event) => event.preventDefault());

const loader = PIXI.Loader.shared;

PIXI.utils.sayHello("WebGL");
PIXI.settings.RESOLUTION = 1.0;

// Initialization
let app = new PIXI.Application({ width: 1200, height: 800, backgroundColor: 0x000000 });
document.body.appendChild(app.view);

// Load all assets from game_data/* files
assetLoader.initialize(loader, main);

// Provide app-wide context accessible from anywhere else, be careful...
AppContext.playerName = "JKase";
AppContext.stage = app.stage;

function main() {
    logService(LogLevel.INFO, "initializing application");

    // For production, this will be another level above for managing overall game state
    // For testing we will jump straight into gameplay with fake data imported above
    logService(LogLevel.WARNING, "running in DEV mode");
    let testState = new GameplayState(japanMap, testGameState);

    // ----- DEBUG CODE -----
    // ----------------------

    app.ticker.add((delta) => {
        Keyboard.update();
        Mouse.update();

        testState.update(delta);
    });
}
