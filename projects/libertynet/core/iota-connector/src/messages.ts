import {Msg} from "@scottburch/rxjs-msg-bus";
import {IMessage, IMilestoneResponse, SingleNodeClient} from "@iota/iota.js";

type Hex = string;
export type ClientConnectedMsg = Msg<'client-connected', SingleNodeClient>
export type CheckNewMilestoneMsg = Msg<'check-new-milestone', number>
export type NewMilestoneDetectedMsg = Msg<'new-milestone-detected', IMilestoneResponse>
export type MilestoneDetectionErrorMsg = Msg<'milestone-detection-error', unknown>
export type NewLibertynetMessageMsg = Msg<'new-libertynet-message', Hex>
export type NewIotaMessageIdMsg = Msg<'new-iota-message-id', Hex>
export type SendIotaMessageAction = Msg<'send-iota-message', IMessage>
export type SendLibertynetMessageAction = Msg<'send-libertynet-message', Hex>