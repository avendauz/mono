import {memoize} from "lodash";
import {openPromisified} from "i2c-bus";

export const getI2cBus = memoize(() => openPromisified(1))