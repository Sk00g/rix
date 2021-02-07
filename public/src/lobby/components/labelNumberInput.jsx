import React, { Component } from "react";
import styled from "styled-components";
import theme from "../theme";

/**
 * Managed Input component for use in a form
 *
 * @param {TEXT} label - Readonly text displayed in left section of component
 * @param {HANDLER} handleChange - Function to respond to user input, should update 'value' prop
 * @param {STRING} value - Text content
 */

const NumberInput = ({ label, handleChange, value, min, max }) => {
    return (
        <DivParent>
            <P>{label}</P>
            <Input
                type={"number"}
                readOnly={handleChange ? false : true}
                onChange={() => {
                    if (value < min || value > max) {
                    }
                    handleChange();
                }}
                value={value || ""}
            />
        </DivParent>
    );
};

//#region Styles

const P = styled.p`
    white-space: nowrap;
    font-size: ${theme.fontSizeSmall};
    color: ${theme.colors.fontWhite};
    margin-right: 1em;
    user-select: none;
`;

const DivParent = styled.div`
    display: flex;
    align-items: center;
    margin: 0 0.5em;
`;

const Input = styled.input`
    padding: 6px 8px 6px 8px;
    color: ${(props) => (props.readOnly ? theme.colors.fontGray : theme.colors.fontWhite)};
    height: 14px;
    border: 1px solid #00000000;
    outline: none;
`;

//#endregion

export default NumberInput;
