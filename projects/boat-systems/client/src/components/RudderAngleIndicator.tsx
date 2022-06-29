import React from "react";
import {AngleIndicator} from "./AngleIndicator";

export interface RudderAngleIndicatorProps {
    value: number
}

export const RudderAngleIndicator:React.FC<RudderAngleIndicatorProps> = ({value}) => {

    return(
        <div style={{width: '50%', height: 200}}>
            <div style={{textAlign: 'center'}}>Rudder Angle</div>
            <AngleIndicator value={value} id={'rudder-angle-indicator'} min={0} max={1024}/>
            <div style={{textAlign: 'center', fontSize: 30}}>{calcRudderAngle(value).toFixed(1)} </div>
        </div>
    );
}

const calcRudderAngle = (value: number) => {
    const center = 1024 / 2;
    const degrees = 1024 / 2 / 42;
    return value > center ? (value - center) / degrees : (center - value) / degrees * -1;
};


