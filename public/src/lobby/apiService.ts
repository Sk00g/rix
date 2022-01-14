import axios from "axios";
import { GameState, GameStatePing } from "../../../model/gameplay";
import { Account, Lobby, Player } from "../../../model/lobby";
import { MapData } from "../../../model/mapData";

type InsertResponse = { insertedId: string };
type UpdateResponse = { updatedId: string };

export default {
    createLobby: async (data: Lobby): Promise<InsertResponse> => {
        let response = await axios.post("/api/lobbies", data);
        return response.data;
    },
    getAllLobbyData: async (): Promise<Lobby[]> => (await axios.get("/api/lobbies")).data,
    getLobbyData: async (id?: string): Promise<Lobby> => (await axios.get(`/api/lobbies/${id}`)).data,
    updateLobby: async (lobbyId: string, player: Player): Promise<UpdateResponse> => {
        let response = await axios.put(`/api/lobbies/${lobbyId}/players`, player);
        return response.data;
    },
    getMapList: async (): Promise<string[]> => (await axios.get("/api/maps")).data,
    getAccountByUsername: async (username: string): Promise<Account> =>
        (await axios.get(`/api/accounts/byUsername?username=${username}`)).data,
    getAccount: async (id: string): Promise<Account> => (await axios.get(`/api/accounts/${id}`)).data,
    getGameState: async (id: string): Promise<GameState> => (await axios.get(`/api/gameStates/${id}`)).data,
    getGameStatePing: async (id: string): Promise<GameStatePing> =>
        (await axios.get(`/api/gameStates/${id}/ping`)).data,
};
