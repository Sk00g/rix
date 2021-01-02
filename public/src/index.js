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
PIXI.settings.RESOLUTION = 1.0;

// Initialization
let app = new PIXI.Application({ width: 800, height: 600, backgroundColor: 0x000000 });
document.body.appendChild(app.view);

// Load images into WebGL compatible format
let imagePaths = [
    "graphics/tilesets/grassBiome/overworld_tileset_grass.png",
    "graphics/ui/source/16x16/Set1/Set1-1.png",
    "graphics/ui/source/16x16/Set2/Set2-1.png",
    "graphics/ui/arrow-green.png",
    "graphics/ui/arrow-gray.png",
    ...["bardo_1.png", "executioner_1.png", "knights_1x.png"].map(
        (path) => `graphics/characters/${path}`
    ),
];

let dancers = [];
let regionLayer = null;

loader.add(imagePaths).load(() => {
    let testMap = new TileMap(
        app.stage,
        japanMap.tilesetPath,
        japanMap.tileMapSize,
        japanMap.tileSize
    );

    const regionData = japanMap.regions;
    regionLayer = new RegionLayer(app.stage, regionData);

    let bard = new UnitAvatar(app.stage, "graphics/characters/bardo_1.png", true);
    bard.setPosition(regionLayer.get("SJ-1").getCenter());
    dancers.push(bard);

    let exec = new UnitAvatar(app.stage, "graphics/characters/executioner_1.png");
    exec.setPosition(regionLayer.get("SJ-2").getCenter());
    dancers.push(exec);

    let knight = new UnitAvatar(app.stage, "graphics/characters/knights_1x.png");
    knight.setPosition(regionLayer.get("SJ-3").getCenter());
    dancers.push(knight);

    let texture = new PIXI.Texture(PIXI.BaseTexture.from("graphics/ui/arrow-green.png"));
    let arrow = new PIXI.Sprite(texture);
    arrow.position.set(300, 100);
    arrow.rotation = Math.PI / 3.254;
    arrow.scale.set(0.9, 0.9);
    arrow.alpha = 0.5;
    app.stage.addChild(arrow);

    texture = new PIXI.Texture(PIXI.BaseTexture.from("graphics/ui/arrow-green.png"));
    let arrow2 = new PIXI.Sprite(texture);
    arrow2.position.set(350, 100);
    arrow2.rotation = Math.PI / 3.254;
    arrow2.scale.set(0.9, 0.9);
    app.stage.addChild(arrow2);

    texture = new PIXI.Texture(PIXI.BaseTexture.from("graphics/ui/arrow-gray.png"));
    let arrowGray = new PIXI.Sprite(texture);
    arrowGray.position.set(400, 100);
    arrowGray.rotation = Math.PI / 3.254;
    arrowGray.scale.set(0.9, 0.9);
    arrowGray.alpha = 0.5;
    app.stage.addChild(arrowGray);

    texture = new PIXI.Texture(PIXI.BaseTexture.from("graphics/ui/arrow-gray.png"));
    let arrowGray2 = new PIXI.Sprite(texture);
    arrowGray2.position.set(450, 100);
    arrowGray2.rotation = Math.PI / 3.254;
    arrowGray2.scale.set(0.9, 0.9);
    app.stage.addChild(arrowGray2);

    // let conductor = new Conductor();
    // conductor.playExecuteAttackSequence(attacker, defender, battleOutcome)
    // conductor.playMoveUnit(unit, region)
    // conductor.playDeploy(region, amount)

    Keyboard.events.on("released", (keyCode, event) => {
        if (keyCode === "KeyA") {
            for (let human of dancers) {
                human.playWalkAnimation();
            }
        } else if (keyCode === "KeyB") {
            for (let human of dancers) {
                human.stopAnimation();
            }
        } else if (keyCode === "KeyC") {
            bard.walk([50, 50]);
        } else if (keyCode === "KeyD") {
            bard.walk([100, 100]);
        } else if (keyCode === "KeyE") {
            bard.walk([200, 100]);
        } else if (keyCode === "KeyF") {
            bard.walk([200, 200]);
        } else if (keyCode === "KeyG") {
            bard.walk([100, 200]);
        } else if (keyCode === "KeyH") {
            bard.setDirection("right");
            bard.playAttackAnimation();
        } else if (keyCode === "KeyI") {
            bard.slide([120, 100], 2);
        } else if (keyCode === "KeyJ") {
            bard.shake(3);
        } else if (keyCode === "KeyK") {
            bard.morphNumber(2.0, 0.08);
        } else if (keyCode === "KeyL") {
            bard.morphNumber(1.0, 0.08);
        } else if (keyCode === "KeyM") {
            bard.blendNumberColor("#ff0000", 50);
        } else if (keyCode === "KeyN") {
            bard.blendNumberColor("#00ff88", 30);
        } else if (keyCode === "KeyO") {
            bard.fade(0.2, 0.01);
        } else if (keyCode === "KeyP") {
            bard.fade(1.0, 0.01);
        } else if (keyCode === "KeyQ") {
            bard.playDeathAnimation();
        } else if (keyCode === "KeyR") {
            bard.morph(2.0, 0.05);
        } else if (keyCode === "KeyS") {
            bard.morph(1.0, 0.08);
        }
    });

    app.ticker.add(gameLoop);
});

function gameLoop(delta) {
    Keyboard.update();
    Mouse.update();

    regionLayer.update(delta, [Mouse.posLocalX, Mouse.posLocalY]);
    dancers.forEach((human) => human.update(delta));
}
