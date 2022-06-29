import {pipe, tap} from "rxjs";

export const tapAsync = <T>(fn: (v: T) => unknown) => pipe(
    tap(() => setTimeout(fn))
)