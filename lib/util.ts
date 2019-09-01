import { Minimatch } from 'minimatch';
import { ResponseI, RequestI } from './types';
import { AxiosResponse } from 'axios';

export class RaiderConfig {
    public static NAME = 'x-response-raider';
    private static _log = false;

    static get log() {
        return RaiderConfig._log;
    }

    static set log(enable: boolean) {
        RaiderConfig._log = enable;
    }

    static get SERVER() {
        const port = 10001;

        const path = `/${RaiderConfig.NAME}`;

        return {
            path,
            port,
            endpoint: `http://localhost:${port}${path}`
        };
    };
}

export const interceptRequest = async (requests: any[], request: RequestI): Promise<ResponseI | undefined> => {
    const handlerMatch = requests.find(mock => {
        const matcher = new Minimatch(mock.uri);

        return matcher.match(request.url || '');
    });

    if (handlerMatch) {
        let response: ResponseI | undefined = handlerMatch.response;

        if (handlerMatch.handle) {
            response = await handlerMatch.handle(((request: any): RequestI => {
                const requestObject = {
                    url: request.url,
                    method: request.method,
                    headers: Object.keys(request.headers || {}).map(
                        name => ({
                            name,
                            value: request.headers[name]
                        })
                    )
                };

                return requestObject;
            })(request));
        }

        return response;
    }
};

export const handleInterceptedResponse = (response: AxiosResponse) => {
    if (response.headers[RaiderConfig.NAME]) {
        return {
            headers: Object.keys(response.headers).map(
                name => ({
                    name,
                    value: response.headers[name]
                })
            ),
            body: response.data,
            status: response.status
        };
    }
};