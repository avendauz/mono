import {keys} from "@libp2p/crypto";

export const generateAccount = () => keys.generateKeyPair('Ed25519')
    .then(key => key.id().then(id => ({
        publicKey: Buffer.from(key.public.bytes).toString('hex'),
        id,
        privateKey: Buffer.from(key.bytes).toString('hex')
    })))
