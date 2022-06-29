import PID from "node-pid-controller";

describe('pid behaviour', () => {
    it('should do something', () => {
        let lastPid = 0;
        let lastSumError = 0;
        let max = 5;
        const pid = new PID({
            k_p: .5,
            k_i: .1,
            k_d: .1,
            dt: 1,
        });
        [1,2,3,4,5,6,7,8,9,8,7,6,5,5,4.4,3,4,3,2].forEach((e, idx) => setTimeout(() => updateRudder(e, pid), idx))


        function updateRudder(e: number, pid: PID) {
            let nextPid = pid.update(e);

            if (Math.abs(nextPid) > max) {
                nextPid = lastPid;
                pid.sumError = lastSumError;
            }
            lastPid = nextPid;
            lastSumError = pid.sumError
        }

    })
});
