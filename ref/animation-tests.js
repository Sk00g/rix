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
