import React from 'react'
import {Card, CardBody, CardHeader} from "reactstrap";
import {useEngineOilPres, useEngineTemp} from "../../services/CommunicationService";

export const EnginePage: React.FC = () => {
    const engineTemp = useEngineTemp();
    const engineOilPres = useEngineOilPres();


    return (
        <Card>
            <CardHeader>
                <span style={{paddingRight: 10}}>Engine</span>
            </CardHeader>
            <CardBody>
                <div style={{display: "flex"}}>
                    <div style={{textAlign: 'right'}}>
                        <div>Engine Temp:</div>
                        <div>Oil pres:</div>
                    </div>
                    <div style={{flex: 1, paddingLeft: 10}}>
                        <div>{engineTemp}</div>
                        <div>{engineOilPres}</div>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
}

//const sendTestData = () => sendToServer({type: 'autopilot-status', data: {} as BoatTalkMsg});
