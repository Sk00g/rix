import React from "react";
import styled from "styled-components";
import theme from "../theme";

interface LabelValueProps {
    label: string;
    value: string | number;
    color?: string;
}

const LabelValue: React.FC<LabelValueProps> = ({ label, value, color }) => {
    return (
        <Div>
            <PLabel color={color}>{label}</PLabel>
            <PValue>{value}</PValue>
        </Div>
    );
};

const Div = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 0.5em;
`;

const PLabel = styled.p`
    color: ${theme.colors.fontMain};
    font-size: ${theme.fontSizeTiny};
    user-select: none;
`;

const PValue = styled.p`
    color: ${(props) => props.color ?? theme.colors.fontWhite};
    font-size: ${theme.fontSizeTiny};
    user-select: none;
`;

export default LabelValue;
