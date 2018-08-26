import { launch } from 'chrome-launcher';
import { Minimatch } from 'minimatch';
import btoa from 'btoa';

const CDP = require('chrome-remote-interface')

export interface ResponseHeaderI {
    name: string;
    value: any;
}

export interface ResponseInterceptorI {
    uri: string;
    headers: ResponseHeaderI[];
    body: any;
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
            interceptionStage: 'HeadersReceived'
        }))
    });

    Network.requestIntercepted(async ({ interceptionId, request }: any) => {
        const response = await Network.getResponseBodyForInterception({
            interceptionId
        });

        const mockResponse = requests.find(mock => {
            const matcher = new Minimatch(mock.uri);

            return matcher.match(request.url);
        });

        if (response.body && mockResponse) {
            console.log(`${request.method} ${request.url}`);
            const mResponse = {
                headers: mockResponse.headers.map(
                    response => `${response.name}: ${response.value}`
                ),
                body: JSON.stringify(mockResponse.body)
            };

            mResponse.headers.push('Content-Type: application/json; charset=utf-8');
            mResponse.headers.push('CConnection: closed');
            mResponse.headers.push(`Date: ${new Date().toUTCString()}`);
            mResponse.headers.push(`Content-Length: ${mResponse.body.length}`);

            return Network.continueInterceptedRequest({
                interceptionId,
                response: response,

                rawResponse: btoa(
                    'HTTP/1.1 200 OK\r\n' +
                    mResponse.headers.join('\r\n') +
                    '\r\n\r\n' +
                    mResponse.body
                )
            });
        }

        Network.continueInterceptedRequest({
            interceptionId,
            response: response
        });
    });
};