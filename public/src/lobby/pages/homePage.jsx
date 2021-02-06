import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import apiService from "../apiService.js";
import FatButton from "../components/fatButton.jsx";
import IconButton, { BUTTON_TYPES } from "../components/iconButton.jsx";
import LabelValue from "../components/labelValue.jsx";
import LobbyFatButton from "../components/lobbyFatButton.jsx";
import theme from "../theme";

const HomePage = (props) => {
    let history = useHistory();

    return (
        <DivRoot>
            <DivTitlebar>
                <div style={{ position: "absolute", left: 0, top: 0, display: "flex" }}>
                    <IconButton
                        type={BUTTON_TYPES.arrowLeft}
                        onClick={() => history.push("/login")}
                    />
                    <IconButton
                        type={BUTTON_TYPES.reset}
                        onClick={() => console.log("refresh connected games?")}
                    />
                </div>
                <PTitle>{`Welcome ${props.username || "Scott"}`}</PTitle>
            </DivTitlebar>
            <DivPlayerStats>
                <PTitle>Player Stats:</PTitle>
                <hr width="80%" />
                <LabelValue label="ELO:" value={1} />
                <LabelValue label="Games Played:" value={2} />
                <LabelValue label="Games Won:" value={3} />
                <LabelValue label="Active Games:" value={4} />
                <LabelValue label="Lobbies:" value={5} />
            </DivPlayerStats>
            <DivActions>
                <DivButton>
                    <FatButton title="Create New Game" onClick={() => history.push("/creator")} />
                    <FatButton title="Join Game" onClick={() => console.log("join existing")} />
                </DivButton>
                <PTitle>Active Games</PTitle>
                <DivButton></DivButton>
            </DivActions>
        </DivRoot>
    );
};

const DivRoot = styled.div`
    display: grid;
    grid-template-rows: min-content auto;
    grid-template-columns: auto min-content;
    width: 1000px;
    height: 600px;
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
`;

export default HomePage;
