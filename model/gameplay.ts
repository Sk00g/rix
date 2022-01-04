import { ObjectId } from "mongodb";
import { Player } from "./lobby";

export interface GameData {
    _id: ObjectId;
    dateCreated: Date;
    createdById: ObjectId;
    createdBy?: string;
    players: Player[];
    gameSettings: any;
    mapName: string;
    tag: string;
}
