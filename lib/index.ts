import { launch } from 'chrome-launcher';
import { Minimatch } from 'minimatch';
import btoa from 'btoa';
import { getStatusText, OK } from 'http-status-codes';
import * as _ from 'lodash';

const CDP = require('chrome-remote-interface')

const RESPONSE_SEPARATOR = '\r\n';

export interface HeaderI {
    name: string;
    value: any;
}

export interface RequestI {
    url: string;
    method: string;
    headers: HeaderI[];
    body?: any;
}

export interface RequestHandlerI {

}

export interface ResponseI {
    headers?: HeaderI[];
    body?: any;
    status?: number;
}

export interface ResponseInterceptorI {
    uri: string;
    response?: ResponseI;
    handle?: (body: RequestI) => ResponseI
}


export const intercept = async (requests: ResponseInterceptorI[]) => {
    const chrome = await launch({
        chromeFlags: [
            '--user-data-dir=/tmp/chrome-testing',
            '--auto-open-devtools-for-tabs'
        ]
    });

    const { Runtime, Network } = await CDP({
        port: chrome.port
    });

    await Promise.all([Runtime.enable(), Network.enable()]);

    Runtime.consoleAPICalled(({ args, type }: { type: 'log' | 'error' | 'info' | 'warn', args: any }) => {
        let logger = console[type];

        if (!logger) {
            logger = console.log;
        }

        logger.apply(console, args.map((a: any) => a.value));
    });

    await Network.setRequestInterception({
        patterns: requests.map(req => ({
            urlPattern: req.uri,
            interceptionStage: 'Request'
        }))
    });

    Network.requestIntercepted(async ({ interceptionId, request }: any) => {
        const handlerMatch = requests.find(mock => {
            const matcher = new Minimatch(mock.uri);

            return matcher.match(request.url);
        });

        if (handlerMatch) {
            let response: ResponseI | undefined = handlerMatch.response;

            if (handlerMatch.handle) {
                response = handlerMatch.handle(((request: any): RequestI => {
                    const requestObject = {
                        url: request.url,
                        method: request.method,
                        headers: Object.keys(request.headers).map(
                            name => ({
                                name,
                                value: request.headers[name]
                            })
                        )
                    };

                    return requestObject;
                })(request));
            }

            if (response) {
                console.log(`${request.method} ${request.url}`);

                let code = response.status ? response.status : OK;

                const isJSON = typeof response.body === 'object';

                const body = isJSON ? JSON.stringify(response.body) : `${response.body}`;

                const headers = _.map(response.headers, header => `${header.name}: ${header.value}`);

                headers.push(`Content-Length: ${body.length}`);

                if (isJSON) {
                    headers.push('Content-Type: application/json;');
                }

                const interceptedRequest = {
                    interceptionId,
                    rawResponse: btoa(
                        `HTTP/1.1 ${code} ${getStatusText(code)}${RESPONSE_SEPARATOR}` +
                        headers.join(RESPONSE_SEPARATOR) +
                        `${RESPONSE_SEPARATOR}${RESPONSE_SEPARATOR}${body}`
                    )
                };

                return Network.continueInterceptedRequest(interceptedRequest);
            }
        }

        Network.continueInterceptedRequest({
            interceptionId
        });
    });
};