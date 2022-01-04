import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import graphics from "../../game_data/graphics";
import { randomInt } from "../../sengine/utils";

interface AvatarProps {
    avatar: string;
}

const DSIZE = [52, 72];

const Avatar: React.FC<AvatarProps> = (props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const indexRef = useRef<number>(3);
    const interval = useRef<any | null>();

    useEffect(() => {
        const image = new Image();
        image.src = `./${graphics.avatar[props.avatar]}`;
        image.addEventListener("load", () => {
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext("2d");
                if (ctx) {
                    ctx.drawImage(image, 0, 0, 26, 36, 0, 0, DSIZE[0], DSIZE[1]);

                    interval.current = setInterval(() => {
                        indexRef.current = indexRef.current === 3 ? 0 : indexRef.current + 1;
                        ctx.clearRect(0, 0, DSIZE[0], DSIZE[1]);
                        let nextIndex = 1;
                        switch (indexRef.current) {
                            case 1:
                                nextIndex = 2;
                                break;
                            case 3:
                                nextIndex = 0;
                                break;
                        }
                        ctx.drawImage(image, 26 * nextIndex, 0, 26, 36, 0, 0, DSIZE[0], DSIZE[1]);
                    }, randomInt(215, 275));
                }
            }
        });

        return () => {
            if (interval.current) clearInterval(interval.current);
        };
    }, []);

    return (
        <DivRoot>
            <canvas ref={canvasRef} width={`${DSIZE[0]}px`} height={`${DSIZE[1]}px`} />
        </DivRoot>
    );
};

const DivRoot = styled.div`
    padding-bottom: 10px;
`;

export default Avatar;
