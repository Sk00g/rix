import React from "react";
import styled from "styled-components";
import theme from "../theme";

interface LabelSelectProps {
    label: string;
    options: string[];
    onChange: (newValue: string) => void;
    value: string;
}

const LabelSelect: React.FC<LabelSelectProps> = (props) => {
    return (
        <DivParent>
            <P>{props.label}</P>
            <Select
                value={props.value ?? ""}
                disabled={!props.onChange}
                onChange={(e) => props.onChange(e.target.value)}
            >
                {props.options && props.options.map((option, index) => <option key={index}>{option}</option>)}
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
