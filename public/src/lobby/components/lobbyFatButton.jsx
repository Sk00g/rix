import React from "react";
import styled from "styled-components";
import theme from "../theme";

const LobbyFatButton = ({ lobby, onClick }) => {
    return (
        <DivRoot onClick={() => onClick(lobby)}>
            <DivThumbnail>
                <img
                    width="80px"
                    height="80px"
                    alt={lobby.mapName}
                    src={`./maps/${lobby.mapName}/thumbnail.png`}
                    style={{ userSelect: "none" }}
                />
            </DivThumbnail>
            <DivSmallLabels>
                <div style={{ display: "flex" }}>
                    <P>Tag:</P>
                    <PValue>{lobby.tag}</PValue>
                </div>
                <P>{new Date(lobby.dateCreated).toDateString().substr(3)}</P>
                <P>{lobby.players.length} Players</P>
            </DivSmallLabels>
            <DivLargeLabels>
                <P>Creator: {lobby.createdBy.username}</P>
            </DivLargeLabels>
        </DivRoot>
    );
};

//#region Styles

const P = styled.p`
    font-size: ${theme.fontSizeTiny};
    user-select: none;
    margin: 0.25em 0;
`;

const PValue = styled(P)`
    color: ${theme.colors.fontMain};
    margin-left: 0.5em;
`;

const DivLargeLabels = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    grid-row: 2 / 3;
    grid-column: 1 / 3;
`;

const DivSmallLabels = styled.div`
    grid-row: 1 / 2;
    grid-column: 2 / 3;
`;

const DivThumbnail = styled.div`
    grid-row: 1 / 2;
    grid-column: 1 / 2;
`;

const DivRoot = styled.div`
    display: grid;
    grid-template-rows: 82px auto;
    grid-template-columns: auto auto;
    color: ${theme.colors.fontWhite};

    margin: 0.75em;
    background: ${theme.colors.dark2};
    width: 180px;
    height: 150px;
    transition: 0.1s ease;

    &:hover {
        width: 185px;
        height: 155px;
        color: ${theme.colors.fontMain};
    }

    &:active {
        width: 185px;
        height: 155px;
        padding-left: 0.07em;
        padding-top: 0.07em;
        color: ${theme.colors.fontMain};
        border: 1px solid #f0f0f0;
    }
`;

//#endregion

export default LobbyFatButton;
