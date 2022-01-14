import React, { Component } from "react";
import styled from "styled-components";
import theme from "../theme";

interface FatButtonProps {
    title: string;
    onClick: (title: string) => void;
}

const FatButton: React.FC<FatButtonProps> = (props) => {
    return (
        <DivRoot onClick={() => props.onClick(props.title)}>
            {props.title.split(" ").map((word, index) => (
                <P key={index}>{word}</P>
            ))}
        </DivRoot>
    );
};

//#region Styles

const P = styled.p`
    font-size: ${theme.fontSizeLarge};
    margin: 0 0 0.5em 0;
    user-select: none;
`;

const DivRoot = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: ${theme.colors.fontWhite};

    margin: 0.75em;
    background: ${theme.colors.dark2};
    padding: 1em;
    width: 120px;
    height: 90px;
    transition: 0.1s ease;

    &:hover {
        width: 130px;
        height: 95px;
        color: ${theme.colors.fontMain};
    }

    &:active {
        width: 130px;
        height: 95px;
        padding-left: 1.07em;
        padding-top: 1.07em;
        color: ${theme.colors.fontMain};
        border: 1px solid #f0f0f0;
    }
`;

//#endregion

export default FatButton;
