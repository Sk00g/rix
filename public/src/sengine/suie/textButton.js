import * as PIXI from "pixi.js";
import Panel from "./panel";
import Label from "./label";
import enums from "./enums";

class TextButton extends Panel {
    constructor(text, position, size, color = enums.PanelColor.BLUE) {
        super(new PIXI.Rectangle(position[0], position[1], size[0], size[1]), color);

        super.addMember(new Label(text, [4, 4]));
    }
}

export default TextButton;
