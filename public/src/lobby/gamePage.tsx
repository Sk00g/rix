import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router";
import styled from "styled-components";
import apiService from "../apiService";
import { enterGame } from "../gameEntry";
import AccountContext from "./contexts/accountContext";
import theme from "./theme";

interface GamePageProps {}

const GamePage: React.FC<GamePageProps> = (props) => {
    const { id } = useParams<{ id: string }>();
    let activeAccount = useContext(AccountContext);

    useEffect(() => {
        if (id) enterGame(id, activeAccount);
    }, [id]);

    return <div></div>;
};

const DivLoading = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
`;

const PLoading = styled.p`
    color: ${theme.colors.fontMain};
    font-size: ${theme.fontSizeLarge};
    text-align: center;
    white-space: nowrap;
    user-select: none;
`;

export default GamePage;
