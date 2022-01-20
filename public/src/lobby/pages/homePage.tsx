import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { Lobby } from "../../../../model/lobby";
import apiService from "../../apiService";
import FatButton from "../components/fatButton";
import IconButton, { ButtonTypes } from "../components/iconButton";
import LabelValue from "../components/labelValue";
import LobbyFatButton from "../components/lobbyFatButton";
import AccountContext from "../contexts/accountContext";
import theme from "../theme";

interface HomePageProps {}

const HomePage: React.FC<HomePageProps> = (props) => {
    let [activeLobbies, setActiveLobbies] = useState<Lobby[]>([]);

    let history = useHistory();
    let activeAccount = useContext(AccountContext);

    useEffect(() => {
        apiService.getAllLobbyData().then((lobbies) => {
            setActiveLobbies(lobbies.filter((lob) => lob.players.find((p) => p.accountId === activeAccount._id)));
        });
    }, []);

    return (
        <DivRoot>
            <DivTitlebar>
                <div style={{ position: "absolute", left: 0, top: 0, display: "flex" }}>
                    <IconButton type={ButtonTypes.arrowLeft} onClick={() => history.push("/login")} />
                    <IconButton type={ButtonTypes.reset} onClick={() => console.log("refresh connected games?")} />
                </div>
                <PTitle>{`Welcome ${activeAccount.username || "Scott"}`}</PTitle>
            </DivTitlebar>
            <DivPlayerStats>
                <PTitle>Player Stats:</PTitle>
                <hr />
                <LabelValue label="ELO:" value={1} />
                <LabelValue label="Games Played:" value={2} />
                <LabelValue label="Games Won:" value={3} />
                <LabelValue label="Active Games:" value={4} />
                <LabelValue label="Lobbies:" value={5} />
            </DivPlayerStats>
            <DivActions>
                <DivButton>
                    <FatButton title="Create New Game" onClick={() => history.push("/manage/creator")} />
                    <FatButton title="Join Game" onClick={() => history.push("/manage/gameJoin")} />
                    <FatButton title="View Games" onClick={() => console.log("coming soon")} />
                </DivButton>
                <PTitle>Active Lobbies</PTitle>
                <DivButton>
                    {activeLobbies.length > 0 &&
                        activeLobbies
                            .filter(
                                (lob) => lob.players.filter((p) => p.status === "ACTIVE").length < lob.players.length
                            )
                            .map((lobby) => (
                                <LobbyFatButton
                                    key={lobby._id}
                                    lobby={lobby}
                                    onClick={() => history.push(`/manage/lobby/${lobby._id}`)}
                                />
                            ))}
                </DivButton>
                <PTitle>Active Games</PTitle>
                <DivButton>
                    {activeLobbies.length > 0 &&
                        activeLobbies
                            .filter(
                                (lob) => lob.players.filter((p) => p.status === "ACTIVE").length === lob.players.length
                            )
                            .map((lobby) => (
                                <LobbyFatButton
                                    key={lobby._id}
                                    lobby={lobby}
                                    onClick={async () => {
                                        const gameState = await apiService.getGameStateByLobby(lobby._id);
                                        history.push(`/game/${gameState._id}`);
                                    }}
                                />
                            ))}
                </DivButton>
            </DivActions>
        </DivRoot>
    );
};

const DivRoot = styled.div`
    display: grid;
    grid-template-rows: min-content auto;
    grid-template-columns: auto min-content;
    width: 1200px;
    height: 700px;
    background-color: ${theme.colors.dark1};
`;

const DivActions = styled.div`
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

export default HomePage;
