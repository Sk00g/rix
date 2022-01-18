import React, { Component } from "react";
import styled from "styled-components";

interface TextInputProps {
    handleChange: (newValue: string) => void;
    handleEnter?: (newValue: string) => void;
    value: string;
    width?: string;
}

const TextInput: React.FC<TextInputProps> = (props) => {
    return (
        <InputStyle
            type={"text"}
            readOnly={!props.handleChange}
            onChange={(e) => props.handleChange(e.target.value)}
            value={props.value ?? ""}
            width={props.width ?? "160px"}
            onKeyDown={(e) => {
                if (e.key === "Enter" && props.handleEnter) props.handleEnter && props.handleEnter?.(props.value);
            }}
        />
    );
};

//#region Styles

const InputStyle = styled.input`
    height: 20px;
    padding: 4px 8px 4px 8px;
    font-size: 10px;
    font-family: "emulogic";
    background-color: ${(props) => (props.readOnly ? "#888" : "#eee")};
    color: ${(props) => (props.readOnly ? "#888" : "#000")};
    border: 1px solid #00000000;
    text-align: center;
    outline: none;

    &:hover {
        background-color: ${(props) => (props.readOnly ? "" : "#ffe4c0")};
    }

    &:focus {
        border: 1px solid ${(props) => (props.readOnly ? "#00000000" : "#ffe4c0")};
    }

    &::selection {
        background: #ffe4c0;
    }
`;

//#endregion

export default TextInput;
