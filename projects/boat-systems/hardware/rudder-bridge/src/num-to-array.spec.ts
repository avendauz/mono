import {expect} from "chai";
import {numToByteArray} from "./num-to-array";

describe('numToByteArray()', () => {
    it('should convert numbers to a byte array', () => {
        expect(numToByteArray(1)).to.deep.equal([1,0]);
        expect(numToByteArray(255)).to.deep.equal([255,0]);
        expect(numToByteArray(256)).to.deep.equal([0, 1]);
        expect(numToByteArray(260)).to.deep.equal([4, 1]);
        expect(numToByteArray(-20)).to.deep.equal([236, 255]);
    })
})