import $ from "jquery";

export default {
    getLobbyData: async function getLobbyData(populated = false, id = null) {
        if (!id) {
            const lobbies = await $.getJSON("/api/lobbies");

            if (populated) {
                const accounts = await $.getJSON("/api/accounts");
                for (let lobby of lobbies) {
                    lobby.createdBy = accounts.find((acct) => acct._id === lobby.createdById);
                }
            }

            return lobbies;
        } else {
            let lobby = await $.getJSON(`/api/lobbies/${id}`);

            if (populated) {
                lobby.createdBy = await $.getJSON(`/api/accounts/${lobby.createdById}`);
            }

            return lobby;
        }
    },
    getMapList: async function getMapList() {
        return await $.getJSON("/api/maps");
    },
};
