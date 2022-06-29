import React from 'react'
import {useCompass} from "../../services/CommunicationService";
import {Card, CardBody, CardHeader} from "reactstrap";

export const CompassPage: React.FC = () => {

    const message = useCompass()
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
                </div>
                <div style={{flex: 1, paddingLeft: 10}}>
                    <div>{message?.heading?.toFixed(1)}</div>
                    <div>{message?.roll}</div>
                    <div>{message?.pitch}</div>
                </div>
            </CardBody>
        </Card>
    )
}