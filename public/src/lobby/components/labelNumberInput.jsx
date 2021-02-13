import React, { Component } from "react";
import styled from "styled-components";
import theme from "../theme";

/**
 * Managed Input component for use in a form
 *
 * @param {TEXT} label - Readonly text displayed in left section of component
 * @param {HANDLER} handleChange - Function to respond to user input, should update 'value' prop
 * @param {STRING} value - Number value
 * @param {INT} min - Minimum value the input will accept
 * @param {INT} max - Max value "" ""
 */

const LabelNumberInput = ({ label, handleChange, value, min, max }) => {
    return (
        <DivParent>
            <P>{label}</P>
            <Input
                type={"number"}
                readOnly={handleChange ? false : true}
                onChange={(e) => {
                    if (e.target.value === "") handleChange(e.target.value);
                    if (e.target.valueAsNumber >= min && e.target.valueAsNumber <= max) handleChange(e.target.value);
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
