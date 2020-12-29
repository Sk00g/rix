import * as PIXI from "pixi.js";
import SUIE from "./sengine/suie/suie.js";
import utils from "./sengine/utils.js";
import UnitAvatar from "./sengine/unitAvatar.js";
import Keyboard from "pixi.js-keyboard";
import Mouse from "pixi.js-mouse";

const loader = PIXI.Loader.shared;

// let unit, enemy, panel;

PIXI.utils.sayHello("WebGL");
PIXI.settings.RESOLUTION = 1.5;

// Initialization
let app = new PIXI.Application({ width: 800, height: 600, backgroundColor: 0xa0aaa0 });
document.body.appendChild(app.view);

// Load images into WebGL compatible format
// let imagePaths = ["bardo_1.png", "executioner_1.png", "knights_1x.png"].map(
//     (path) => `graphics/characters/${path}`
// );
// imagePaths.push("graphics/ui/source/source.png");
let imagePaths = ["graphics/tilesets/grassBiome/overworld_tileset_grass.png"];
loader.add(imagePaths).load(() => {
    console.log("finished loading graphics");

    unit = new UnitAvatar("graphics/characters/knights_1x.png");
    unit.sprite.position.set(200, 200);

    enemy = new UnitAvatar(
        "graphics/characters/knights_1x.png",
        new PIXI.Rectangle(156, 2, 26, 36)
    );
    enemy.sprite.position.set(100, 200);

    panel = new SUIE.Panel(
        new PIXI.Rectangle(500, 50, 100, 100),
        SUIE.PanelSize.LARGE,
        SUIE.PanelColor.ORANGE
    );
    panel.addMember(new SUIE.Label("Hello scott", [15, 10]));
    panel.addMember(new SUIE.TextButton("log", [20, 20], () => console.warn("booyah!")));
    panel.addMember(new SUIE.TextButton("logi", [20, 40]));
    panel.addMember(new SUIE.TextButton("login", [20, 60]));
    panel.addMember(new SUIE.TextButton("logine", [20, 80]));
    panel.addMember(new SUIE.TextButton("loginr", [20, 100]));
    panel.addMember(new SUIE.TextButton("loginrest", [20, 120]));

    /* 
    app.stage.addChild(new SUIE.Panel(
        [app.view.width / 2 - 100, app.view.height / 2 - 200, 200, 400],
        [
            new SUIE.Label([50, 50], 12, "#eeeeee", "Username")
        ]
    )) 
    */

    Keyboard.events.on("released", (keyCode, event) => {
        switch (keyCode) {
            case "KeyA":
                unit.playWalkAnimation();
                enemy.playWalkAnimation();
                break;
            case "KeyB":
                unit.stopAnimation();
                enemy.stopAnimation();
                break;
            case "ArrowRight":
                unit.setDirection("right");
                break;
            case "ArrowLeft":
                unit.setDirection("left");
                break;
            case "ArrowDown":
                unit.setDirection("down");
                break;
            case "ArrowUp":
                unit.setDirection("up");
                break;
        }
    });

    app.stage.addChild(unit.sprite);
    app.stage.addChild(enemy.sprite);
    app.stage.addChild(panel);

    app.ticker.add(gameLoop);
});

function gameLoop(delta) {
    unit.update(delta);
    enemy.update(delta);
    // panel.update(delta);

    Keyboard.update();
    Mouse.update();
}
