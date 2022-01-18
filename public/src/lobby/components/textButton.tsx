import React, { Component } from "react";
import styled from "styled-components";

interface TextButtonProps {
    handleClick: () => void;
    text: string;
    disabled?: boolean;
    width?: string;
    height?: string;
}

const TextButton: React.FC<TextButtonProps> = (props) => {
    return (
        <Button
            disabled={props.disabled}
            onClick={props.handleClick}
            width={props.width ?? "120px"}
            height={props.height}
        >
            {props.text}
        </Button>
    );
};

//#region Styles

const Button = styled.button<any>`
    font-size: 10px;
    font-family: "emulogic";
    color: #ffe4c0;
    height: ${(props) => props.height ?? ""};
    width: ${(props) => props.width ?? "130px"};
    padding: 1em;
    background: #333;
    border: 1px solid #00000000;
    margin: 0.5em;
    align-content: center;
    outline: none;

    &:hover {
        background: #383838;
        cursor: pointer;
    }

    &:active {
        background: #666;
    }

    &:disabled {
        background: #aaa;
    }
`;

//#endregion

export default TextButton;
