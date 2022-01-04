import React from "react";
import styled from "styled-components";

interface ColorBarProps {
    color: string;
}

const ColorBar: React.FC<ColorBarProps> = (props) => {
    return <DivRoot color={props.color}></DivRoot>;
};

const DivRoot = styled.div<{ color: string }>`
    width: 60px;
    height: 20px;
    background: ${(props) => props.color};
`;

export default ColorBar;
