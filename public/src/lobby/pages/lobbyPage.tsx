import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import styled from "styled-components";
import { Account, Player } from "../../../../model/lobby";
import { PlayerStatus } from "../../../../model/enums";
import { GameData } from "../../../../model/gameplay";
import apiService from "../apiService";
import IconButton, { BUTTON_TYPES } from "../components/iconButton.jsx";
import PlayerRow from "../components/playerRow";
import TextButton from "../components/textButton";
import AccountContext from "../contexts/accountContext";
import theme from "../theme";

const LobbyPage = () => {
    const [gameData, setGameData] = useState<GameData>();

    const account = useContext(AccountContext);
    const { gameId } = useParams<{ gameId: string }>();
    const history = useHistory();

    useEffect(() => {
        if (gameId) {
            apiService.getLobbyData(true, gameId).then(async (data: GameData) => {
                const promises: Promise<Account>[] = data.players.map((p) => apiService.getAccount(p._id));
                const accounts = await Promise.all(promises);
                for (let account of accounts) {
                    const match = data.players.find((p) => p._id === account._id);
                    if (match) match.username = account?.username ?? "UNKNOWN";
                }
                setGameData(data);
            });
        }
    }, [gameId]);

    const _getPlayer = (): Player | undefined => {
        return gameData?.players.find((p) => p._id === account._id);
    };

    const _handleToggle = async () => {
        let player = _getPlayer();
        if (!player || !gameData?._id) return;
        player.status = player.status === PlayerStatus.Active ? PlayerStatus.Waiting : PlayerStatus.Active;
        await apiService.updateLobby(gameData._id, player);
        const newGame = { ...gameData };
        const newPlayers = [...gameData.players];
        const id = newPlayers.indexOf(player);
        newPlayers[id] = player;
        newGame.players = newPlayers;
        setGameData(newGame);
    };

    return (
        <DivRoot>
            <DivTitlebar>
                <div style={{ position: "absolute", left: 0, top: 0, display: "flex" }}>
                    <IconButton type={BUTTON_TYPES.arrowLeft} onClick={() => history.push("/home")} />
                    <IconButton type={BUTTON_TYPES.reset} onClick={() => console.log("refresh lobby games?")} />
                </div>
                {gameData && (
                    <PTitle>{`[${gameData.players.length} PLAYERS] ${gameData.gameSettings.victoryCondition} on ${gameData.mapName}`}</PTitle>
                )}
            </DivTitlebar>

            <DivMain>
                <div style={{ margin: "2em" }}>
                    <div>
                        {gameData && (
                            <img
                                width="200px"
                                height="200px"
                                alt={gameData?.mapName ?? "Map loading..."}
                                src={`./maps/${gameData?.mapName}/thumbnail.png`}
                                style={{ userSelect: "none" }}
                            />
                        )}
                    </div>

                    {/* Will put chat here in the future */}
                </div>

                <div style={{ margin: "2em" }}>
                    {gameData?.players?.map((player) => (
                        <PlayerRow key={player._id} player={player} />
                    ))}
                </div>
            </DivMain>

            <DivInfo>
                Info area
                <TextButton
                    text={_getPlayer()?.status === PlayerStatus.Active ? "Not Ready" : "Ready"}
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
