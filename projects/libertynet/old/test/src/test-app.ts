import {sendEvent} from "@scottburch/rxjs-msg-bus";
import {EnableLogCentralBusMsg} from '../../../core/zz-old/app/src'

sendEvent<EnableLogCentralBusMsg>('enable-log-central-bus');
