import {of, tap} from "rxjs";
import {switchToLatestFrom} from "../lib/switchToLatestFrom";
import {expect} from "chai";

describe('switchToLatestFrom', () => {
    it('should switch to the latest from an observable', () =>
        of('testing').pipe(
            switchToLatestFrom(of('another')),
            tap(value => expect(value).to.equal('another'))
        ).subscribe()
    )
})