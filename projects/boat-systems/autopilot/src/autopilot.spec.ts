import {calcDirectionalDiff} from "./autopilot";
import {expect} from "chai";

describe('calcDirectionalDiff()', () => {
    it('should return 0 if the angles are the same', () => {
        expect(calcDirectionalDiff(10, 10)).to.equal(0);
    });

    it('should return a single decimal place', () => {
        expect(calcDirectionalDiff(10.2, 12.3)).to.equal(2.1);
    });

    it('should return a negative number', () => {
        expect(calcDirectionalDiff(12.3, 10.2)).to.equal(-2.1);
    });

    it('should handle angles spanning 0', () => {
        expect(calcDirectionalDiff(12.3, 350.7)).to.equal(-21.6);
        expect(calcDirectionalDiff(90, 270)).to.equal(180);
        expect(calcDirectionalDiff(90, 269.9)).to.equal(179.9);
        expect(calcDirectionalDiff(90, 270.1)).to.equal(-179.9);
    });
});