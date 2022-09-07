import React from 'react'
import {useCompass, useCompassCalibration} from "../../services/CommunicationService";
import {Card, CardBody, CardHeader} from "reactstrap";

export const CompassPage: React.FC = () => {

    const message = useCompass()
    const cal = useCompassCalibration()

    return (
        <Card>
            <CardHeader>
                <span style={{paddingRight: 10}}>Compass</span>
            </CardHeader>
            <CardBody style={{display: "flex"}}>
                <div style={{textAlign: 'right'}}>
                    <div>Heading:</div>
                    <div>Roll:</div>
                    <div>Pitch:</div>
                    <div>Time:</div>
                    <div>High Time:</div>
                    <h4>Calibration</h4>
                    <div>Compass:</div>
                    <div>Accel:</div>
                    <div>Mag:</div>
                    <div>Gyro:</div>
                </div>
                <div style={{flex: 1, paddingLeft: 10}}>
                    <div>{message?.heading?.toFixed(1)}</div>
                    <div>{message?.roll}</div>
                    <div>{message?.pitch}</div>
                    <div>Not implimented</div>
                    <div>Not implimented</div>
                    <h4>&nbsp;</h4>
                    <div>{cal.cmps}</div>
                    <div>{cal.accel}</div>
                    <div>{cal.mag}</div>
                    <div>{cal.gyro}</div>
                </div>
            </CardBody>
        </Card>
    )
}