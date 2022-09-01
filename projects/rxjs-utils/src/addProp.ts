import {map, pipe} from "rxjs";

export const addProp = <T, P, PN extends string>(obj: T, prop: PN) => pipe(
    map((p: P) => ({...obj, [prop]: p} as T & Record<PN, P>))
);
