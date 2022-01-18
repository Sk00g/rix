import { Account } from "./../../model/lobby";
import * as PIXI from "pixi.js";
import assetLoader from "./assetLoader";
import Keyboard from "pixi.js-keyboard";
import Mouse from "pixi.js-mouse";
import GameStateManager from "./gameStates/gameStateManager";
import { logService, LogLevel } from "./logService";
import AppContext from "./appContext";
import apiService from "./apiService";

export default async function enterGame(gameStateId: string, account: Account) {
    // Universally get rid of default right-click behaviour
    document.addEventListener("contextmenu", (event) => event.preventDefault());

    const loader = PIXI.Loader.shared;

    PIXI.utils.sayHello("WebGL");
    PIXI.settings.RESOLUTION = 1.0;

    // Initialization
    let app = new PIXI.Application({ width: 1400, height: 900, backgroundColor: 0x000000 });
    document.getElementById("main")?.appendChild(app.view);

    // Load all assets from game_data/* files
    await assetLoader.initialize(loader);

    // Download current game state from server
    const testGameState = await apiService.getGameState(gameStateId);
    const lobby = await apiService.getLobbyData(testGameState.lobbyId);
    const mapData = await import(`../dist/maps/${testGameState.mapName}/${testGameState.mapName}.json`);

    // Provide app-wide context accessible from anywhere else, be careful...
    AppContext.stage = app.stage;
    const player = lobby.players.find((p) => p.accountId === account._id);
    if (!player) throw new Error("Authentication issue...");
    AppContext.player = player;

    logService(LogLevel.INFO, "initializing application");

    logService(LogLevel.WARNING, "running in DEV mode");
    let stateMaster = new GameStateManager(mapData, testGameState, lobby);

    // ----- DEBUG CODE -----
    // ----------------------

    app.ticker.add((delta) => {
        Keyboard.update();
        Mouse.update();

        stateMaster.update(delta);
    });
}
