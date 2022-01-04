import React from "react";
import styled from "styled-components";
import { Player } from "../../../../model/lobby";
import { PlayerStatus } from "../../../../model/enums";
import { RGBFromString, StringFromRGB } from "../../sengine/utils";
import theme from "../theme";
import Avatar from "./avatar";
import ColorBar from "./colorBar";

interface PlayerRowProps {
    player: Player;
}

const PlayerRow: React.FC<PlayerRowProps> = (props) => {
    return (
        <DivRoot>
            <PName>{props.player.username ?? "UNKNOWN"}</PName>

            <Avatar avatar={props.player.avatar ?? "blank"} />

            <PStatus active={props.player.status === PlayerStatus.Active}>{props.player.status}</PStatus>

            <ColorBar color={`#${props.player.color?.toString(16)}` ?? theme.colors.fontGray} />
        </DivRoot>
    );
};

const DivRoot = styled.div`
    display: flex;
    align-items: center;
    margin: 1em;
`;

const PStatus = styled.p<{ active: boolean }>`
    color: ${(props) => (props.active ? theme.colors.fontMain : theme.colors.fontGray)};
    font-size: ${theme.fontSizeLarge};
    user-select: none;
    margin: 0 2em;
`;

const PName = styled.p`
    color: ${theme.colors.fontWhite};
    font-size: ${theme.fontSizeLarge};
    user-select: none;
    margin: 0 2em;
`;

export default PlayerRow;
