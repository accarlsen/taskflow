import React, { useEffect, useState, useRef } from 'react';

import style from './progressDonut.module.css'


const ProgressDonut = (props) => {
    const {
        size,
        progress,
        strokeWidth,
        circleOneStroke,
        circleTwoStroke,
    } = props;
    const progressR = Math.round(progress*10)/10
    const center = size / 2;
    const radius = size / 2 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;

    const [offset, setOffset] = useState(0);
    const circleRef = useRef(null);

    useEffect(() => {
        const progressOffset = ((100 - progressR) / 100) * circumference;
        setOffset(progressOffset);
        circleRef.current.style = 'transition: stroke-dashoffset 850ms ease-in-out;';
    }, [setOffset, circumference, progressR, offset]);

    return (
        <>
            <svg className={style.svg} width={size} height={size}>
                <circle
                    className={style.svgCircleBg}
                    stroke={circleOneStroke}
                    cx={center}
                    cy={center}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <g transform="rotate(-90.1 50 50)">
                    <circle
                        className={style.svgCircle}
                        stroke={circleTwoStroke}
                        cx={center}
                        cy={center}
                        r={radius}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        ref={circleRef}
                    />
                </g>
                <text className={`text-fade-in ${style.svgCircleText}`} x={center} y={center}>
                    {progressR}%
                </text>
            </svg>
        </>
    );
}
export default ProgressDonut;