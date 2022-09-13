import {cd, exec} from "./exec";
import {expect} from "chai";
import {describe} from 'mocha'

describe('exec', () => {
    it('should list a file in the current directory', () =>
        exec`echo "testing"`
            .then((result) => expect(result).to.equal('testing'))
    );

    it('should take an array in the template', () =>
        exec`echo ${['testing']}`
            .then((result) => expect(result).to.equal('testing'))
    );

    it('should take a string in the template', () =>
        exec`echo "${'1'}2${3}4 ${[5,6,7]} 8${9}"`
            .then((result) => expect(result).to.equal('1234 5 6 7 89'))
    );

    it('should take a number in the template', () =>
        exec`echo ${0}`
            .then((result) => expect(result).to.equal('0'))
    );

    it('should take multiple properties', () =>
        exec`ls ${['-l', '-h']}`
            .then((result) => expect(result).to.contain('drwxr-xr-x'))
    )

    it('should take an array with a number in it', () =>
        exec`echo ${['-w', 2]}`
            .then((result) => expect(result).to.equal('-w 2'))
    );


    it('should return a ProcessPromise', () => {
        const start = Date.now();
        const p1 = exec`top -l 1000`;
       const p2 = exec`top -l 1000`;
       const p3 = exec`top -l 1000`;
       setTimeout(() => {
           p1.kill();
           p2.kill();
           p3.kill();
       }, 500)
    });

    it('should return the complete output of a script', function () {
            this.timeout(60_000);
            const epsilon = 1;
            const size = 1024 * 1024 + epsilon;
            return exec`yarn ts-node ./src/largeOutputScript.ts ${size}`
                .then(output => output.split('\n'))
                .then(output => output.filter(line => line.includes('00000000')))
                .then(output => Buffer.from(output[0]).length)
                .then(outputSize => expect(outputSize).to.equal(size)).toPromise()
        }
    );

    describe('cd', () => {
        it('should set the cwd for the following commands', () => {
            cd('src');
            return exec`ls`
                .then((result) => expect(result).to.contain('exec.ts'))
        })
    })
})