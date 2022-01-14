import React, { Component } from "react";
import styled from "styled-components";
import theme from "../theme";

interface LabelNumberInputProps {
    label: string;
    onChange?: (newValue: string) => void;
    value: string;
    min: number;
    max: number;
}

const LabelNumberInput: React.FC<LabelNumberInputProps> = ({ label, onChange, value, min, max }) => {
    return (
        <DivParent>
            <P>{label}</P>
            <Input
                type={"number"}
                readOnly={onChange ? false : true}
                onChange={(e) => {
                    if (e.target.value === "") onChange?.(e.target.value);
                    if (e.target.valueAsNumber >= min && e.target.valueAsNumber <= max) onChange?.(e.target.value);
                }}
                value={value === undefined ? "" : value}
            />
        </DivParent>
    );
};

//#region Styles

const P = styled.p`
    white-space: nowrap;
    font-size: ${theme.fontSizeTiny};
    color: ${theme.colors.fontWhite};
    margin-right: 1em;
    user-select: none;
`;

const DivParent = styled.div`
    display: flex;
    align-items: center;
    margin: 0.3em 0.5em;
`;

const Input = styled.input`
    padding: 6px 8px 6px 8px;
    color: ${(props) => (props.readOnly ? theme.colors.fontGray : "black")};
    height: 14px;
    border: 1px solid #00000000;
    outline: none;
    width: 100px;
`;

//#endregion

export default LabelNumberInput;
