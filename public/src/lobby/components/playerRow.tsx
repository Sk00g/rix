import React from "react";
import styled from "styled-components";
import { Player } from "../../../../model/lobby";
import { PlayerStatus } from "../../../../model/enums";
import theme from "../theme";
import Avatar from "./avatar";
import ColorBar from "./colorBar";

interface PlayerRowProps {
    index: number;
    player?: Player;
}

const PlayerRow: React.FC<PlayerRowProps> = (props) => {
    return (
        <DivRoot>
            <PName>{props.index + "."}</PName>
            {props.player ? (
                <>
                    <PName>{props.player.username ?? "UNKNOWN"}</PName>

                    <Avatar avatar={props.player.avatar ?? "blank"} />
                    <ColorBar color={`#${props.player.color?.toString(16)}` ?? theme.colors.fontGray} />
                    <PStatus active={props.player.status === PlayerStatus.Active}>{props.player.status}</PStatus>
                </>
            ) : (
                <PLabel>OPEN</PLabel>
            )}
        </DivRoot>
    );
};

const DivRoot = styled.div`
    display: flex;
    align-items: center;
    margin: 1em;
`;

const PStatus = styled.p<{ active: boolean }>`
    color: ${(props) => (props.active ? theme.colors.green : theme.colors.fontGray)};
    font-size: ${theme.fontSizeLarge};
    user-select: none;
    margin: 0 2em;
`;

const PLabel = styled.p`
    color: ${theme.colors.fontMain};
    font-size: ${theme.fontSizeLarge};
    margin: 0 0.5em;
    white-space: nowrap;
    user-select: none;
`;

const PName = styled.p`
    color: ${theme.colors.fontWhite};
    font-size: ${theme.fontSizeLarge};
    user-select: none;
    margin: 0 1em;
`;

export default PlayerRow;
