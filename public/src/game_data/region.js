import * as utils from "../sengine/utils.js";
import AppContext from "../appContext.js";
import graphics from "./graphics.js";
import UnitAvatar from "../sengine/unitAvatar";

export default class Region {
    constructor() {
        this.name = null;
        this.owner = null;
        this.armySize = 1;
        this.continent = null;
        this.avatar = null;
        this.visual = null;
    }

    toString() {
        return `${this.name} [${this.armySize} | ${this.owner.name}] (${this.continent.name})`;
    }

    renderAvatar() {
        if (this.avatar) AppContext.stage.removeChild(this.avatar);

        this.avatar = new UnitAvatar(
            AppContext.stage,
            graphics.avatar[this.owner.avatarType],
            utils.NationColor[this.owner.nationColor]
        );
        this.avatar.setPosition(this.visual.getUnitCenter());
        this.avatar.setCounter(this.armySize);
        this.avatar.setDirection("down");
    }
}
