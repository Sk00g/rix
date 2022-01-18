import { Point } from "./../model";
import * as PIXI from "pixi.js";

class Label extends PIXI.Text {
    constructor(text: string, position: Point, fontSize = 6, fontColor = "#dddddd") {
        super(text, { fontFamily: "emulogic", fontSize: fontSize, fill: fontColor });

        this.position.set(...position);
    }
}

export default Label;
