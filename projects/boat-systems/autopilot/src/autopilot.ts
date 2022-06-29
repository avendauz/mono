import {
    BehaviorSubject,
    combineLatest,
    filter,
    map,
    of, sampleTime,
    switchMap,
    tap,
    withLatestFrom,
    interval,
    throttleTime
} from "rxjs";
import {Some} from "monet";
import PID from 'node-pid-controller'
import {
    AutopilotStatusMsg,
    CompassMsg,
    CourseErrorMsg, PidGainsMsg,
    SetCourseMsg,
    SetPidMsg,
    SetRudderMsg
} from "boat-talk/src/messages";
import {startBoatTalkNetwork} from "boat-talk";
import {eventListener, sendEvent, sendEventPartial} from "@scottburch/rxjs-msg-bus";


process.argv[1] === __filename && setTimeout(() => autopilot())

export const AUTOPILOT_OFF = -1;

type MyPid = PID & { prevPidOut: number }


const DEFAULT_PID_GAINS = {p: 5, i: .2, d: .2}


export const autopilot = () => {
    console.log('Autopilot running...');
    startBoatTalkNetwork('autopilot')

    sendEvent<SetCourseMsg>('set-course', AUTOPILOT_OFF);
    sendEvent<CompassMsg>('compass', {heading: 0, compassTime: 0, pitch: 0, roll: 0});
    sendEvent<PidGainsMsg>('pid-gains', DEFAULT_PID_GAINS);
    sendEvent<SetRudderMsg>('set-rudder', {rudder: 0, compassTime: 0})

    eventListener<SetCourseMsg>('set-course').pipe(
        filter(course => course === AUTOPILOT_OFF),
        tap(() => sendEvent<CourseErrorMsg>('course-error', {error: 0, compassTime: 0})),
        tap(() => sendEvent<SetRudderMsg>('set-rudder', {rudder: 0, compassTime: 0}))
    ).subscribe();

    combineLatest([
        eventListener<SetCourseMsg>('set-course'),
        eventListener<CompassMsg>('compass')
    ]).pipe(
            filter(([course]) => course !== AUTOPILOT_OFF),
            map(([course, compassInfo]) => ({
                error: calcDirectionalDiff(course, compassInfo.heading),
                compassTime: compassInfo.compassTime
            })),
            tap(sendEventPartial<CourseErrorMsg>('course-error'))
        ).subscribe()

    combineLatest([
        eventListener<SetCourseMsg>('set-course'),
        eventListener<CourseErrorMsg>('course-error')
    ]).pipe(
        filter(([course]) => course !== AUTOPILOT_OFF),
        sampleTime(1000),
        switchMap(([_, errorInfo]) =>
                calculateRudder(errorInfo.error).pipe(
                    map(rudder => ({rudder, compassTime: errorInfo.compassTime}))
                )
        ),
        tap(sendEventPartial<SetRudderMsg>('set-rudder'))
    ).subscribe();


    const calculateRudder = (error: number) =>
        of(error).pipe(
            withLatestFrom(pid$),
            map(([error, pid]) => pid?.update(error)),
            withLatestFrom(pid$),
            map(([out, pid]) => {
                const nextRudder = Math.trunc((out || 0) - (pid?.prevPidOut || 0))
                pid && (pid.prevPidOut = out || 0)
                return nextRudder
            }),
            map(newRudder => newRudder < 0 ? Math.max(-200, newRudder) : Math.min(200, newRudder))
        );

    const pid$ = new BehaviorSubject<MyPid | undefined>(undefined);

    eventListener<SetPidMsg>('set-pid').pipe(
        withLatestFrom(eventListener<PidGainsMsg>('pid-gains')),
        map(([msg, gains]) => ({...gains, [msg.option]: msg.value})),
        tap(sendEventPartial<PidGainsMsg>('pid-gains'))
    ).subscribe();

    combineLatest([eventListener<PidGainsMsg>('pid-gains'), pid$]).pipe(
        filter(([_, pid]) => !!pid),
        tap(([gains, pid]) => {
            pid && (pid.k_p = gains.p);
            pid && (pid.k_i = gains.i);
            pid && (pid.k_d = gains.d);
        })
    ).subscribe();

    // Create PID if one doees not exist yet
    eventListener<SetCourseMsg>('set-course').pipe(
        withLatestFrom(pid$),
        filter(([course, pid]) => course !== AUTOPILOT_OFF && !pid),
        tap(() => pid$.next(Object.assign(new PID(), {prevPidOut: 0})))
    ).subscribe();

    // Remove PID if autopilot off
    eventListener<SetCourseMsg>('set-course').pipe(
        filter(course => course === AUTOPILOT_OFF),
        tap(() => pid$.next(undefined)),
    ).subscribe();

    combineLatest([
        eventListener<SetCourseMsg>('set-course'),
        eventListener<CourseErrorMsg>('course-error'),
        eventListener<PidGainsMsg>('pid-gains'),
        interval(2000)
    ])
        .pipe(
            throttleTime(500),
            tap(([course, error, pid]) => sendAutopilotStatus(course, error, pid))
        )
        .subscribe();


    function sendAutopilotStatus(course: number, errorInfo: CourseErrorMsg['data'], pidGains: PidGainsMsg['data']) {
        sendEvent<AutopilotStatusMsg>('autopilot-status', {
            course,
            error: errorInfo.error,
            kP: pidGains.p,
            kI: pidGains.i,
            kD: pidGains.d
        });
    }
}

export const calcDirectionalDiff = (angle1: number, angle2: number): number =>
    Some(angle2 - angle1)
        .map(diff => diff < -180 ? diff + 360 : diff)
        .map(diff => diff > 180 ? diff - 360 : diff)
        .map(n => Math.round(n * 10) / 10)
        .join();




