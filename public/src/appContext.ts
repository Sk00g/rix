import { NationColor, PlayerStatus } from "../../model/enums";
import { Player } from "./../../model/lobby";

interface IAppContext {
    stage: PIXI.Container;
    player: Player;
}

const context: IAppContext = {
    stage: {} as PIXI.Container,
    player: {
        accountId: "UNKNOWN",
        status: PlayerStatus.Waiting,
        avatar: "knight",
        username: "UNKNOWN",
        color: NationColor.RED,
        alive: true,
    },
};

export default context;
