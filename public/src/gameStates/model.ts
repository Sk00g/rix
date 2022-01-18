import { Point } from "./../sengine/model";
import Region from "../gameData/region";
import UnitAvatar from "../sengine/unitAvatar";

export enum GameplayStateType {
    VIEW_ONLY = "VIEW_ONLY",
    REPLAY_TURN = "REPLAY_TURN",
    DEPLOY = "DEPLOY",
    ORDER = "ORDER",
    RegionSelect = "REGION_SELECT",
    EditAmount = "EDIT_AMOUNT",
    Confirm = "CONFIRM",
    PreSelect = "PRE_SELECT",
    TargetSelect = "TARGET_SELECT",
    OrderEdit = "ORDER_EDIT",
    OrderConfirm = "ORDER_CONFIRM",
}

export interface IOrder {
    hitbox: Point[];
    origin: Region;
    target: Region;
    avatar: UnitAvatar;
    amount: number;
    marker: any;
}
