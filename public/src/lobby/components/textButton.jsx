import React, { Component } from "react";
import styled from "styled-components";

/**
 * Managed text-only button component
 *
 * @param {HANDLER} handleClick - Click handler function
 * @param {STRING} text - Displayed inside button
 * @param {BOOLEAN} disabled - Disabled click function and used for styling
 * @param {WIDTH} [OPTIONAL]width - Optional CSS width to specify button size
 */

const TextButton = ({ text, disabled, handleClick }) => {
    return (
        <Button disabled={disabled} onClick={handleClick}>
            {text}
        </Button>
    );
};

//#region Styles

const Button = styled.button`
    font-size: 10px;
    font-family: "emulogic";
    color: #ffe4c0;
    width: ${(props) => props.width || "130px"};
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
