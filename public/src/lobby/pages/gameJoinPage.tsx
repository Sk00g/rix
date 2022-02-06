import React, { useContext, useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import styled from "styled-components";
import TextButton from "../components/textButton";
import apiService from "../../apiService";
import IconButton, { ButtonTypes } from "../components/iconButton";
import LabelValue from "../components/labelValue";
import LobbyFatButton from "../components/lobbyFatButton";
import TextInput from "../components/textInput";
import AccountContext from "../contexts/accountContext";
import theme from "../theme";
import { Lobby, Player } from "../../../../model/lobby";
import { NationColor, PlayerStatus } from "../../../../model/enums";

const GameJoinPage: React.FC = () => {
    let [selectedLobby, setSelectedLobby] = useState<Lobby>();
    let [lobbies, setLobbies] = useState<Lobby[]>([]);
    let [allLobbies, setAllLobbies] = useState<Lobby[]>([]);
    let [searchText, setSearchText] = useState<string>("");

    let history = useHistory();
    let activeAccount = useContext(AccountContext);

    useEffect(() => {
        apiService.getAllLobbyData().then((data) => {
            // Filter out lobbies that we are already members of
            data = data.filter((item) => !item.players.find((p) => p.accountId === activeAccount._id));

            setLobbies(data);
            setAllLobbies(data);
        });
    }, []);

    const _applySearch = () => {
        setLobbies(
            searchText
                ? allLobbies.filter((item) => item.tag.toLowerCase().includes(searchText.toLowerCase()))
                : allLobbies
        );
    };

    const _handleJoin = () => {
        if (!selectedLobby) return;

        const newPlayer: Player = {
            username: activeAccount.username,
            alive: true,
            accountId: activeAccount._id,
            status: PlayerStatus.Waiting,
            color: NationColor.BLUE,
            avatar: "bard",
        };

        apiService
            .updateLobby(selectedLobby._id, newPlayer)
            .then((rsp) => {
                history.push(`/manage/lobby/${selectedLobby?._id}`);
            })
            .catch((err) => console.log("failed adding account to lobby", err));
    };

    return (
        <DivRoot>
            <DivTitlebar>
                <div style={{ position: "absolute", left: 0, top: 0, display: "flex" }}>
                    <IconButton type={ButtonTypes.arrowLeft} onClick={() => history.push("/manage/home")} />
                    <IconButton type={ButtonTypes.reset} onClick={() => console.log("refresh connected lobbies?")} />
                </div>
                <PTitle>{`JOIN A NEW GAME`}</PTitle>
            </DivTitlebar>
            <DivPlayerStats>
                {selectedLobby && (
                    <div style={{ margin: "0.25em" }}>
                        <PTitle>{`Game ${selectedLobby.tag}`}</PTitle>
                        <hr />
                        <LabelValue
                            label="CREATED"
                            value={new Date(selectedLobby.dateCreated).toDateString().substr(3)}
                        />
                        <LabelValue
                            label="PLAYERS"
                            value={`${selectedLobby.players.length} / ${selectedLobby.gameSettings.maxPlayers}`}
                        />
                        <LabelValue
                            label="READY"
                            value={`${selectedLobby.players.reduce(
                                (prev, cur) => (cur.status === "ACTIVE" ? prev + 1 : prev),
                                0
                            )} / ${selectedLobby.players.length}`}
                        />
                        <LabelValue label="MAP" value={selectedLobby.mapName} />
                        <LabelValue label="TYPE" value={selectedLobby.gameSettings.victoryCondition} />
                        <LabelValue label="DEPLOY TYPE" value={selectedLobby.gameSettings.initialDeploymentType} />
                        <LabelValue label="INITIAL DEPLOY" value={selectedLobby.gameSettings.initialDeployAmount} />
                        <LabelValue label="PUBLIC CHAT" value={selectedLobby.gameSettings.publicChatEnabled} />
                        <LabelValue label="PRIVATE CHAT" value={selectedLobby.gameSettings.privateChatEnabled} />
                        <LabelValue label="ROUND LIMIT" value={selectedLobby.gameSettings.roundLimit} />
                        <LabelValue label="BASE REINFORCE" value={selectedLobby.gameSettings.baseReinforcements} />
                        <LabelValue label="REGION REINFORCE" value={selectedLobby.gameSettings.regionReinforceFactor} />
                        <LabelValue
                            label="CONNECTED REINFORCE"
                            value={selectedLobby.gameSettings.connectedRegionReinforceFactor}
                        />
                        <LabelValue
                            label="CONNECTED THRESHOLD"
                            value={selectedLobby.gameSettings.connectedRegionReinforceThreshold}
                        />
                        <LabelValue
                            label="1st ROUND ATTACK"
                            value={selectedLobby.gameSettings.firstRoundAttackEnabled}
                        />
                        <LabelValue label="LIMIT DEPLOY" value={selectedLobby.gameSettings.deployLimitation} />
                        <TextButton text="JOIN" handleClick={_handleJoin} />
                    </div>
                )}
            </DivPlayerStats>
            <DivGames>
                <PTitle>SEARCH</PTitle>
                <div style={{ display: "flex" }}>
                    <TextInput
                        value={searchText}
                        handleChange={setSearchText}
                        width="300px"
                        handleEnter={_applySearch}
                    />
                    <IconButton type={ButtonTypes.arrowRight} onClick={_applySearch} />
                </div>
                <PTitle>AVAILABLE GAMES</PTitle>
                <DivButton>
                    {lobbies.length > 0 &&
                        lobbies.map((lobby) => (
                            <LobbyFatButton
                                key={lobby.tag}
                                lobby={lobby}
                                onClick={(lobby) => setSelectedLobby(lobby)}
                            />
                        ))}
                </DivButton>
            </DivGames>
        </DivRoot>
    );
};

const DivRoot = styled.div`
    display: grid;
    grid-template-rows: 40px auto;
    grid-template-columns: auto 220px;
    width: 1000px;
    height: 600px;
    background-color: ${theme.colors.dark1};
`;

const DivGames = styled.div`
    grid-row: 2 / 3;
    grid-column: 1 / 2;
    padding: 1em;
`;

const DivButton = styled.div`
    display: flex;
    flex-wrap: wrap;
    height: 154px;
`;

const DivPlayerStats = styled.div`
    display: flex;
    flex-direction: column;
    grid-row: 1 / 3;
    grid-column: 2 / 3;
    background-color: ${theme.colors.dark2};
    height: 100%;
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
`;

export default GameJoinPage;
