import React from "react";
import styled from "styled-components";

const PATH_PREFIX = "./graphics/ui/source/32x32/Set1/Set1-";

export enum ButtonTypes {
    blank = 1,
    arrowRight = 3,
    arrowDown = 4,
    arrowLeft = 20,
    arrowUp = 21,
    reset = 6,
    grid = 7,
    help = 8,
    options = 9,
    minus = 13,
    scroller = 14,
    delete = 15,
    save = 16,
    start = 18,
    mail = 19,
    plus = 22,
}

interface IconButtonProps {
    type: ButtonTypes;
    onClick: () => void;
}

const IconButton: React.FC<IconButtonProps> = (props) => {
    let url = `${PATH_PREFIX}${props.type}.png`;
    return (
        <div style={{ position: "relative" }}>
            <img alt={String(props.type)} src={url} width="32" height="32" />
            <DivShadow onClick={props.onClick} />
        </div>
    );
};

const DivShadow = styled.div`
    position: absolute;
    left: 2px;
    top: 2px;
    border-radius: 4px;
    width: 28px;
    height: 28px;

    &:hover {
        background: #ffffff22;
    }

    &:active {
        background: #ffffff33;
    }
`;

export default IconButton;
