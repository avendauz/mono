import {Msg} from "@scottburch/rxjs-msg-bus";

export type CourseErrorMsg = Msg<'course-error', {
    error: number,
    compassTime: number
}>

export type CompassMsg = Msg<'compass', {
    heading: number,
    roll: number,
    pitch: number,
    compassTime: number
}>

export type CalibrateCompassMsg = Msg<'calibrate-compass'>

export type SetCourseMsg = Msg<'set-course', number>

export type PidGainsMsg = Msg<'pid-gains', { p: number, i: number, d: number }>

export type SetPidMsg = Msg<'set-pid', {
    option: string,
    value: number
}>

export type AutopilotStatusMsg = Msg<'autopilot-status', {
    course: number
    error: number
    kP: number
    kI: number
    kD: number
}>

export type CompassDeltaMsg = Msg<'compass-delta', {
    compassDelta: number
}>

export type SetRudderMsg = Msg<'set-rudder', {
    rudder: number
    compassTime: number
}>

export type RudderPositionMsg = Msg<'rudder-position', {
    value: number
    error: string
}>

export type AisMsg = Msg<'ais', {
    nema: string
}>

export type EngineTempMsg = Msg<'engine-temp', number>
export type EngineOilPressMsg = Msg<'engine-oil-pres', number>
