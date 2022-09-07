import {generateAccount} from "./sdk";
import {expect} from "chai";

describe('sdk', () => {
    describe('generateAccount()', () => {
        it('should generate an account', () =>
            generateAccount()
                .then(x => {
                    expect(x.publicKey).to.match(/^[0-9a-f]*$/);
                    expect(x.privateKey).to.match(/^[0-9a-f]*$/);
                    expect(x.publicKey).to.have.length(72);
                    expect(x.privateKey).to.have.length(136);
                    expect(x.id).to.have.length(52);
                })
        )
    })
})