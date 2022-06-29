import {
    sendToServer,
    useAutopilotStatus,
    useCompass, useCompassDelta,
    useRudderPosition,
    useSetRudder
} from "../../services/CommunicationService";
import {Card, CardBody, CardHeader} from "reactstrap";
import React, {useEffect} from "react";
import {fromEvent, tap} from "rxjs";
import {RedGreen} from "../../components/redGreen";
import {RudderAngleIndicator} from "../../components/RudderAngleIndicator";
import {ErrorAngleIndicator} from "../../components/ErrorAngleIndicator";
import {SetCourseMsg, SetPidMsg} from "boat-talk";


type KeyHandler = (ev: KeyboardEvent) => void

export const AutopilotPage: React.FC = () => {

    const autopilotStatusMsg = useAutopilotStatus();
    const rudderPos = useRudderPosition();
    const compass = useCompass();
    const setRudder = useSetRudder();
    const compassDelta = useCompassDelta();
    //
    // const [course, setCourse] = useState(autopilotStatusMsg.course);
    // const [kP, setKp] = useState(autopilotStatusMsg.kP);
    // const [kI, setKi] = useState(autopilotStatusMsg.kI);
    // const [kD, setKd] = useState(autopilotStatusMsg.kD);

    useListenForKey('c', toggleAutopilot);
    useListenForKey('ArrowRight', setCourseStarboard);
    useListenForKey('ArrowLeft', setCoursePort);
    useListenForKey('p', setPValue);
    useListenForKey('i', setIValue);
    useListenForKey('d', setDValue);
    useListenForKey('P', setPValue);
    useListenForKey('I', setIValue);
    useListenForKey('D', setDValue);

    function useListenForKey(key: string, handler: KeyHandler) {
        useEffect(() => {
            const sub = fromEvent<KeyboardEvent>(document, 'keyup')
                .pipe(
                    tap(ev => ev.key === key && handler(ev)),
                ).subscribe()
            return () => sub.unsubscribe();
        }, [handler, key])
    }


    function toggleAutopilot() {
        sendToServer<SetCourseMsg>({
            type: 'set-course',
            data: (autopilotStatusMsg?.course ?? -1) >= 0 ? -1 : Math.round(compass?.heading ?? 0)
        });
    }

    function setPValue(ev: KeyboardEvent) {
        sendToServer<SetPidMsg>({
            type: 'set-pid',
            data: {
                option: 'p',
                value: autopilotStatusMsg?.kP + (ev.shiftKey ? -0.1 : 0.1)
            }
        })
    }

    function setIValue(ev: KeyboardEvent) {
        sendToServer<SetPidMsg>({
            type: 'set-pid',
            data: {
                option: 'i',
                value: autopilotStatusMsg?.kI + (ev.shiftKey ? -0.1 : 0.1)
            }
        })
    }

    function setDValue(ev: KeyboardEvent) {
        sendToServer<SetPidMsg>({
            type: 'set-pid',
            data: {
                option: 'd',
                value: autopilotStatusMsg?.kD + (ev.shiftKey ? -0.1 : 0.1)
            }
        })
    }

    function setCourseStarboard() {
        sendToServer<SetCourseMsg>({
            type: 'set-course',
            data: ((autopilotStatusMsg?.course || 0) + 1) % 360
        })
    }

    function setCoursePort() {
        let newCourse = ((autopilotStatusMsg?.course || 0) - 1);
        if (newCourse < 0) newCourse = 359;
        sendToServer<SetCourseMsg>({
            type: 'set-course',
            data: newCourse
        })
    }

    return (
        <Card>
            <CardHeader>
                <span style={{paddingRight: 10}}>Autopilot</span>
            </CardHeader>
            <CardBody>
                <div style={{display: "flex"}}>
                    <div style={{textAlign: 'right'}}>
                        <div>Course:</div>
                        <div>Heading:</div>
                        <div>Error:</div>
                        <div>Rudder:</div>
                        <div>Compass Time:</div>
                        <div>(P):</div>
                        <div>(I):</div>
                        <div>(D):</div>
                    </div>
                    <div style={{flex: 1, paddingLeft: 10}}>
                        <div>{autopilotStatusMsg?.course === -1 ? 'off' : autopilotStatusMsg?.course}</div>
                        <div>{compass.heading?.toFixed(1)}</div>
                        <div><RedGreen>{autopilotStatusMsg?.error?.toFixed(1)}</RedGreen></div>
                        <div><RedGreen>{setRudder.rudder?.toFixed(1)}</RedGreen></div>
                        <div>{compassDelta.compassDelta}</div>
                        <div>{autopilotStatusMsg?.kP?.toFixed(1)}</div>
                        <div>{autopilotStatusMsg?.kI?.toFixed(1)}</div>
                        <div>{autopilotStatusMsg?.kD?.toFixed(1)}</div>
                    </div>
                </div>
                <hr/>
                <div style={{display: 'flex'}}>
                    <RudderAngleIndicator value={rudderPos}/>
                    <ErrorAngleIndicator disabled={autopilotStatusMsg?.course === -1} value={autopilotStatusMsg?.error}/>
                </div>
            </CardBody>
        </Card>
    )
}


