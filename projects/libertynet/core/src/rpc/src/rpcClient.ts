import {JSONRPCClient} from "json-rpc-2.0";
import fetch from 'node-fetch'

export const newRpcClient = (url: string) => {
    const rpcClient = new JSONRPCClient((jsonRPCRequest) =>
        fetch(`${url}/json-rpc`, {
            method: "POST",
            headers: {"content-type": "application/json"},
            body: JSON.stringify(jsonRPCRequest),
        }).then((response: any) => {
            if (response.status === 200) {
                return response
                    .json()
                    .then((jsonRPCResponse: any) => rpcClient.receive(jsonRPCResponse));
            } else if (jsonRPCRequest.id !== undefined) {
                return Promise.reject(new Error(response.statusText));
            }
        })
    )
    return rpcClient;
};
