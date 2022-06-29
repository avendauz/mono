import {tap, timer} from "rxjs";
import {getMyIp} from "./broadcast-iam";
import {expect} from 'chai';

describe('broadcast-iam', () => {
    it("should retrieve my ip address", (done) => {
        timer(0).pipe(
            getMyIp(),
            tap(ip => expect(ip).to.contain('192.168'))
        ).subscribe(() => done());
    })
})