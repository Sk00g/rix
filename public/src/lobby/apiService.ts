import axios from "axios";
import { Player } from "../../../model/lobby";
import { GameData } from "../../../model/gameplay";
import { NationColor } from "../../../model/enums";

export default {
    createLobby: async function createLobby(data) {
        let response = await axios.post("/api/lobbies", data);
        return response.data;
    },
    getLobbyData: async function getLobbyData(populated: boolean = false, id?: string): Promise<GameData[]> {
        if (!id) {
            const response = await axios.get("/api/lobbies");
            const lobbies = response.data;

            if (populated) {
                const response = await axios.get("/api/accounts");
                let accounts = response.data;
                for (let lobby of lobbies) {
                    lobby.createdBy = accounts.find((acct) => acct._id === lobby.createdById);
                }
            }

            return lobbies;
        } else {
            let response = await axios.get(`/api/lobbies/${id}`);
            let lobby = response.data;

            if (populated) {
                let response = await axios.get(`/api/accounts/${lobby.createdById}`);
                lobby.createdBy = response.data;
            }

            for (let player of lobby.players) {
                player.color = NationColor[player.color];
            }

            return [lobby as GameData];
        }
    },
    updateLobby: async function updateLobby(lobbyId: string, player: Player) {
        let response = await axios.put(`/api/lobbies/${lobbyId}/players`, player);
        return response.data;
    },
    getMapList: async function getMapList() {
        let response = await axios.get("/api/maps");
        return response.data;
    },
    getAccountByUsername: async function getAccountByUsername(username: string) {
        let response = await axios.get(`/api/accounts/byUsername?username=${username}`);
        return response.data;
    },
    getAccount: async function getAccount(id) {
        let response = await axios.get(`/api/accounts/${id}`);
        return response.data;
    },
};
