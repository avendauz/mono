import {map, Observable, pipe, withLatestFrom} from "rxjs";

export const switchToLatestFrom = <T>(observable: Observable<T>) => pipe(
    withLatestFrom(observable),
    map(([_, value]) => value)
);