import * as PIXI from "pixi.js";
import assetLoader from "./assetLoader";
import Keyboard from "pixi.js-keyboard";
import Mouse from "pixi.js-mouse";
import GameStateManager from "./gameStates/gameStateManager";
import { logService, LogLevel } from "./logService";
import AppContext from "./appContext";

// In the future, map data and game state data should be pulled from the server, for testing
// we will use hard-coded JSON test data instead
import protomap from "../dist/maps/Protomap/Protomap.json";
import apiService from "./lobby/apiService";

export default async function enterGame() {
    // Universally get rid of default right-click behaviour
    document.addEventListener("contextmenu", (event) => event.preventDefault());

    const loader = PIXI.Loader.shared;

    PIXI.utils.sayHello("WebGL");
    PIXI.settings.RESOLUTION = 1.0;

    // Initialization
    let app = new PIXI.Application({ width: 1400, height: 900, backgroundColor: 0x000000 });
    document.getElementById("main")?.appendChild(app.view);

    // Load all assets from game_data/* files
    assetLoader.initialize(loader, main);

    // Download current game state from server
    const testGameState = await apiService.getGameState("61de5286e8dc75644013466f");

    // Provide app-wide context accessible from anywhere else, be careful...
    AppContext.playerName = "JKase";
    AppContext.stage = app.stage;

    function main() {
        logService(LogLevel.INFO, "initializing application");

        // For production, this will be another level above for managing overall game state
        // For testing we will jump straight into gameplay with fake data imported above
        logService(LogLevel.WARNING, "running in DEV mode");
        let stateMaster = new GameStateManager(protomap, testGameState);

        // ----- DEBUG CODE -----
        // ----------------------

        app.ticker.add((delta) => {
            Keyboard.update();
            Mouse.update();

            stateMaster.update(delta);
        });
    }
}
