import { CommandSet } from "./../../model/gameplay";
import axios from "axios";
import { GameState, GameStatePing, PlayerDeployment } from "../../model/gameplay";
import { Account, Lobby, Player } from "../../model/lobby";

type InsertResponse = { insertedId: string };
type UpdateResponse = { updatedId: string };

export default {
    createLobby: async (data: Lobby): Promise<InsertResponse> => {
        let clean: any = { ...data };
        delete clean._id;
        delete clean.dateCreated;
        delete clean.tag;
        let response = await axios.post("/api/lobbies", clean);
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
    getGameStateByLobby: async (lobbyId: string): Promise<GameStatePing> =>
        (await axios.get(`/api/gameStates/byLobby/${lobbyId}`)).data,
    sendCommandSet: async (gameId: string, commands: CommandSet) =>
        (await axios.put(`/api/gameStates/${gameId}/commands`, commands)).data,
};
