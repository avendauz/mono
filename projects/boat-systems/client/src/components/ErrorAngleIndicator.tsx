import React from "react";
import {AngleIndicator} from "./AngleIndicator";

export interface ErrorAngleIndicatorProps {
    value: number,
    disabled: boolean
}

export const ErrorAngleIndicator:React.FC<ErrorAngleIndicatorProps> = ({value,disabled}) => {

    return(
        <div style={{width: '50%', height: 200, opacity: disabled ? .3 : 1}}>
            <div style={{textAlign: 'center'}}>Error</div>
            <AngleIndicator value={angleToValue(value)} id={'error-angle-indicator'} min={0} max={180}/>
            <div style={{textAlign: 'center', fontSize: 30}}>{disabled ? 'OFF' : value?.toFixed(1)} </div>
        </div>
    );
}

const angleToValue = (angle: number): number => angle + 90;



