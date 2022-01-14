import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import styled from "styled-components";
import { Account, Player } from "../../../../model/lobby";
import { PlayerStatus } from "../../../../model/enums";
import { Lobby } from "../../../../model/lobby";
import apiService from "../apiService";
import IconButton, { ButtonTypes } from "../components/iconButton.jsx";
import PlayerRow from "../components/playerRow";
import TextButton from "../components/textButton";
import AccountContext from "../contexts/accountContext";
import theme from "../theme";

const LobbyPage = () => {
    const [lobby, setLobby] = useState<Lobby>();

    const account = useContext(AccountContext);
    const { id } = useParams<{ id: string }>();
    const history = useHistory();

    useEffect(() => {
        if (id) apiService.getLobbyData(id).then(setLobby);
    }, [id]);

    const _getThisPlayer = (): Player | undefined => {
        return lobby?.players.find((p) => p.accountId === account._id);
    };

    const _handleToggle = async () => {
        let player = _getThisPlayer();
        if (!player || !lobby?._id) return;
        player.status = player.status === PlayerStatus.Active ? PlayerStatus.Waiting : PlayerStatus.Active;
        await apiService.updateLobby(lobby._id, player);
        const newLobby = { ...lobby };
        const newPlayers = [...lobby.players];
        const id = newPlayers.indexOf(player);
        newPlayers[id] = player;
        newLobby.players = newPlayers;
        setLobby(newLobby);
    };

    return (
        <DivRoot>
            <DivTitlebar>
                <div style={{ position: "absolute", left: 0, top: 0, display: "flex" }}>
                    <IconButton type={ButtonTypes.arrowLeft} onClick={() => history.push("/home")} />
                    <IconButton type={ButtonTypes.reset} onClick={() => console.log("refresh lobby games?")} />
                </div>
                {lobby && (
                    <PTitle>{`[${lobby.players.length} PLAYERS] ${lobby.gameSettings.victoryCondition} on ${lobby.mapName}`}</PTitle>
                )}
            </DivTitlebar>

            <DivMain>
                <div style={{ margin: "2em" }}>
                    <div>
                        {lobby && (
                            <img
                                width="200px"
                                height="200px"
                                alt={lobby?.mapName ?? "Map loading..."}
                                src={`./maps/${lobby?.mapName}/thumbnail.png`}
                                style={{ userSelect: "none" }}
                            />
                        )}
                    </div>

                    {/* Will put chat here in the future */}
                </div>

                <div style={{ margin: "2em" }}>
                    {lobby?.players?.map((player) => (
                        <PlayerRow key={player.accountId} player={player} />
                    ))}
                </div>
            </DivMain>

            <DivInfo>
                Info area
                <TextButton
                    text={_getThisPlayer()?.status === PlayerStatus.Active ? "Not Ready" : "Ready"}
                    handleClick={_handleToggle}
                />
            </DivInfo>
        </DivRoot>
    );
};

const DivMain = styled.div`
    display: flex;
    grid-row: 2 / 3;
    grid-column: 1 / 2;
`;

const DivInfo = styled.div`
    display: flex;
    flex-direction: column;
    grid-row: 1 / 3;
    grid-column: 2 / 3;
    background: ${theme.colors.dark2};
    width: 200px;
`;

const DivTitlebar = styled.div`
    margin: 0.5em;
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    grid-row: 1 / 2;
    grid-column: 1 / 2;
    height: 32px;
`;

const PTitle = styled.p`
    color: ${theme.colors.fontMain};
    font-size: ${theme.fontSizeMedium};
    align-self: center;
    user-select: none;
    margin-top: 2em;
`;

const DivRoot = styled.div`
    display: grid;
    grid-template-rows: min-content auto;
    grid-template-columns: auto min-content;
    width: 1200px;
    height: 700px;
    background-color: ${theme.colors.dark1};
`;

export default LobbyPage;
