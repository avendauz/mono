import {map, pipe} from "rxjs";

export const dot = <IN, P extends keyof IN>(prop: P) => pipe(map((obj: IN) => obj[prop] as IN[P]));
