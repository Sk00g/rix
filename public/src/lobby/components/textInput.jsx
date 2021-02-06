import React, { Component } from "react";
import styled from "styled-components";

/**
 * Managed Input component for use in a form
 *
 * @param {HANDLER} handleChange - Function to respond to user input, should update 'value' prop
 * @param {STRING} value - Text content
 * @param {CSS} [OPTIONAL]width - Width of the input's parent div, defaults to 100%
 */

class TextInput extends Component {
    render() {
        return (
            <InputStyle
                type={"text"}
                readOnly={this.props.handleChange ? false : true}
                onChange={this.props.handleChange}
                value={this.props.value || ""}
                width={this.props.width || "160px"}
            />
        );
    }
}

//#region Styles

const InputStyle = styled.input`
    height: 20px;
    padding: 4px 8px 4px 8px;
    font-size: 10px;
    font-family: 'emulogic';
    background-color: ${(props) => (props.readOnly ? "#888" : "#eee")};
    font-color: ${(props) => (props.readOnly ? "#888" : "#000")};
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
        background: #ffe4c0};
    }
`;

//#endregion

export default TextInput;
