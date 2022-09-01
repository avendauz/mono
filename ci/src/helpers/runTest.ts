import {exec} from "@scottburch/exec";

export const runTest = (name: string) => {
    exec(`lerna bootstrap`)
        .then(() => {exec`lerna run build --scope @scottburch/rxjs-msg-bus`})
        .then(() => {exec`lerna run test --scope ${name}`})
}
