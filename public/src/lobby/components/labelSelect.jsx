import React, { Component } from "react";
import styled from "styled-components";
import theme from "../theme";

/**
 * Managed Select component for use in forms
 *
 * @param {STRING} label - Text of the input's label
 * @param {ARRAY-OBJECT} options - List of options available in the select. Either text object to use as value and display text, or
 *                                 an object { value: "", label: "" } to separate displayed text (label) from actual value (value)
 * @param {HANDLER} handleChange - Function to respond to user input, should update 'value' prop
 * @param {STRING} value - Selected value
 */

const LabelSelect = (props) => {
    return (
        <DivParent>
            <P>{props.label}</P>
            <Select
                value={props.value || ""}
                readOnly={props.handleChange ? false : true}
                onChange={(e) => props.handleChange(e.target.value)}
            >
                {props.options && props.options.map((option) => <option key={option}>{option}</option>)}
            </Select>
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

const Select = styled.select`
    padding: 3px 8px 2px 4px;
    border: 1px solid #00000000;
    outline: none;
`;

//#endregion

export default LabelSelect;
