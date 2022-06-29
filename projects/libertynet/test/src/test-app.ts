import {sendEvent} from "@scottburch/rxjs-msg-bus";
import {EnableLogCentralBusMsg} from '@libertynet/app'

sendEvent<EnableLogCentralBusMsg>('enable-log-central-bus');
