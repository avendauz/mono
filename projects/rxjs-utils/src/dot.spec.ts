import {of, tap} from "rxjs";
import {expect} from "chai";
import {dot} from "../lib";

describe('dot', () => {
    it('should return the value of an property in a pipe', () =>
        of({prop: {foo: 'testing'}}).pipe(
            dot('prop'),
            tap(x => expect(x).to.deep.equal({foo:'testing'})),
        ).subscribe()
    );

    it('should return undefined if there is no property by that name', () =>
        of({} as {fake: string}).pipe(
            dot('fake'),
            tap(x => expect(x).to.be.undefined)
        )
    )
})