import {filter, flatten, join, map, trim} from "lodash/fp";
import {isArray} from "lodash";
import {ChildProcess, spawn} from 'child_process'

let cwd = process.cwd();

export const cd = (dir: string) => cwd = dir;

export class ProcessPromise<T> {
    private children: ChildProcess[] = [];
    private p: Promise<T>

    constructor(p: Promise<T>) {
        this.p = p;
    }

    static resolve<X>(v: X) {return new ProcessPromise<X>(Promise.resolve(v))}

    setChild(p:ChildProcess) {
        this.children.push(p);
        return p;
    }

    then<R>(fn: (value: T) => R | PromiseLike<R>) {
        const pp =  new ProcessPromise(this.p.then(fn));
        pp.children = this.children
        return pp
    }

    toPromise() {
        return this.p
    }

    kill() {
        this.children.forEach(c => {
            c.kill();
        })
    }
}


export const exec = (...args: (Omit<TemplateStringsArray, 'raw'> | string | number | (string | number)[])[]): ProcessPromise<string> => {
    const p:ProcessPromise<string> = ProcessPromise.resolve(args)
        .then(args => ({template: args[0], args: args.slice(1)}))
        .then(x => (x.template as string[]).map((el, i) => [el, x.args[i]]))
        .then(flatten)
        .then(map(el => isArray(el) ? el.join(' ') : el))
        .then(filter(el => el !== undefined))
        .then(map(el => el.toString()))
        .then(join(''))
        .then(cmd => {
            console.log(`$${cmd}`);
            return cmd;
        })
        .then(cmd => (p.setChild(spawn(cmd, {cwd, shell: true}))))
        .then(child => new Promise((resolve, reject) => {
            let stdout: Buffer[] = [];
            let stderr: Buffer[] = [];
            const stdoutStr = child.stdout?.pipe(process.stdout);
            const stderrStr = child.stderr?.pipe(process.stderr);
            child.stdout?.on('data', d => stdout.push(d));
            child.stderr?.on('data', d => stderr.push(d));
            child.on('close', () => {
                const data = Buffer.concat(stdout);
                resolve(trim(new TextDecoder().decode(data)))
            });
            child.on('error', () => {
                const data = Buffer.concat(stderr);
                reject(trim(new TextDecoder().decode(data)));
            })
        }));
    return p
}

