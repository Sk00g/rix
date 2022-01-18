import { Direction } from "./../sengine/model";
import { RegionVisual } from "../regionLayer";
import AppContext from "../appContext";
import graphics from "./graphics";
import UnitAvatar from "../sengine/unitAvatar";
import { Player } from "../../../model/lobby";

export default class Region {
    name: string;
    owner: Player;
    size = 1;
    continent: any;
    avatar: UnitAvatar;
    visual: RegionVisual;

    toString() {
        return `${this.name} [${this.size} | ${this.owner?.username}] (${this.continent.name})`;
    }

    renderAvatar() {
        if (!AppContext.stage) return;

        if (this.avatar) AppContext.stage.removeChild(this.avatar.sprite);

        this.avatar = new UnitAvatar(AppContext.stage, graphics.avatar[this.owner.avatar], this.owner.color);
        this.avatar.setPosition(this.visual.getUnitCenter());
        this.avatar.setCounter(this.size);
        this.avatar.setDirection(Direction.Down);
    }
}
