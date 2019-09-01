import { launch } from 'chrome-launcher';
import btoa from 'btoa';
import { getStatusText, OK } from 'http-status-codes';
import * as _ from 'lodash';
import axios from 'axios';

import { ResponseInterceptorI, RequestI } from './types';
import { interceptRequest, handleInterceptedResponse, RaiderConfig } from './util';

const CDP = require('chrome-remote-interface')

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

        if (RaiderConfig.log) {
            logger.apply(console, args.map((a: any) => a.value));
        }
    });

    await Network.setRequestInterception({
        patterns: requests.map(req => ({
            urlPattern: req.uri,
            interceptionStage: 'Request'
        }))
    });

    Network.requestIntercepted(async ({ interceptionId, request }: any) => {
        const response = await interceptRequest(requests, request);

        if (response) {
            console.log(`${request.method} ${request.url}`);

            const isJSON = typeof response.body === 'object';

            const body = isJSON ? JSON.stringify(response.body) : `${response.body}`;

            const headers = _.map(response.headers, header => `${header.name}: ${header.value}`);

            headers.push(`Content-Length: ${body.length}`);

            if (isJSON) {
                headers.push('Content-Type: application/json;');
            }

            const responseCode = response.status ? response.status : OK;

            const RESPONSE_SEPARATOR = '\r\n';

            return Network.continueInterceptedRequest({
                interceptionId,
                rawResponse: btoa(
                    `HTTP/1.1 ${responseCode} ${getStatusText(responseCode)}${RESPONSE_SEPARATOR}` +
                    headers.join(RESPONSE_SEPARATOR) +
                    `${RESPONSE_SEPARATOR}${RESPONSE_SEPARATOR}${body}`
                )
            });
        }

        Network.continueInterceptedRequest({
            interceptionId
        });
    });
};

export const interceptor = async () => {
    return intercept([
        {
            uri: '**',
            handle: async (request: RequestI) => {

                try {
                    const response = await axios.post(RaiderConfig.SERVER.endpoint, request);

                    return handleInterceptedResponse(response);
                } catch (error) {
                    if (error.response) {
                        return handleInterceptedResponse(error.response);
                    }
                }
            },
        },
    ]);
};

