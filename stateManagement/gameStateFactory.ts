import { MapData } from "./../model/mapData";
import { formatDatetime } from "../public/src/sengine/utils";
import { GameState } from "./../model/gameplay";
import { Lobby } from "./../model/lobby";
import protomap from "../public/dist/maps/Protomap/Protomap.json";

export default async function initializeGame(db: any, lobby: Lobby): Promise<string> {
    console.log("initializing lobby");

    // In the future this should pull data from the server obviously, not a file
    const mapData: MapData = protomap;
    const settings = lobby.gameSettings;

    // Determine from game settings initial deployment size and players
    var initialRegions = {};
    if (settings.initialDeploymentType === "Random") {
        // Create pool of ownerships evenly distributed across players
        let count = 0;
        let ownerships: string[] = [];
        while (ownerships.length < mapData.regions.length) {
            ownerships.push(lobby.players[count].username);
            count++;
            if (count >= lobby.players.length) count = 0;
        }

        for (let region of mapData.regions) {
            const index = Math.floor(Math.random() * ownerships.length);
            let owner = ownerships[index];
            ownerships.splice(index, 1);
            initialRegions[region.name] = { owner, size: settings.initialRegionAmount };
        }
    } else {
        throw new Error("Unsupported deployment type");
    }

    const game: GameState = {
        lobbyId: lobby._id,
        dateStarted: formatDatetime(new Date()),
        mapName: lobby.mapName,
        players: lobby.players,
        turnHistory: [],
        initialRegionState: initialRegions,
        pendingCommandSets: {},
    };
    console.log("result", game);

    let response = await db.collection("gameStates").insertOne(game);
    return response.insertedId;
}

/*
{
    "baseReinforcements": 3,
    "regionReinforceFactor": 3,
    "connectedRegionReinforceFactor": 3,
    "connectedRegionReinforceThreshold": 5
}
*/
