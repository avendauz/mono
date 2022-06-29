import {exec} from "@scottburch/exec";
const nodeModulesPath = require.resolve('ts-node').replace(/node_modules.*/, 'node_modules');

const filepath = process.cwd();
const filename = process.argv[2];

console.log('**** Generating proto')
console.log('***', `${filepath}/${filename}`);


setTimeout(() => generateProto(filename));



export function generateProto(filename: string) {
    return exec`yarn protoc --plugin=${__dirname}/../node_modules/.bin/protoc-gen-ts_proto --ts_proto_out=${filepath}/src ${filepath}/${filename} ${getOptions()}`
}

const getOptions = () => [
    `--proto_path`, filepath + '/src'
]

// export function generateProto(filename: string) {
//     return exec`${nodeModulesPath}/.bin/pbjs -t static-module -w commonjs -p src -o ${filepath}/${filename}.pb.js ${filepath}/${filename}.proto`
//         .then(() => exec` ${nodeModulesPath}/.bin/pbts -o ${filepath}/${filename}.pb.d.ts ${filepath}/${filename}.pb.js`.toPromise());
// }