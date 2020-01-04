
import { TargetBrowser, TargetBrowserConnection, TargetDescription, ResponseInterceptorI } from '../types';
import axios from 'axios';
import { interval } from 'rxjs';
import { getStatusText, OK } from 'http-status-codes';
import * as _ from 'lodash';
import btoa from 'btoa';
import { interceptRequest } from './misc';
import { Config } from './config';

const CDP = require('chrome-remote-interface');

export class Debugger {
    private connections: TargetBrowserConnection[] = [];
    private requests: ResponseInterceptorI[] = [];

    constructor() {
    }

    loadInterceptors(requests: ResponseInterceptorI[]) {
        this.requests = requests;
    }


    async connect(target: TargetBrowser) {
        const connectionIndex = this.getConnectionIndex(target);

        if (connectionIndex === -1) {
            const connection = await this.connectToTarget(target);

            this.connections.push({
                ...target,
                connection
            });
        }
    }

    get Count() {
        return this.connections.length;
    }


    listen(port: number, delay: number) {
        interval(delay).subscribe(async () => {
            const targets = await this.getTargets(port);

            targets.map((target: any) => target.id).forEach((id: any) => {
                this.connect({
                    port,
                    id
                });
            });
        });
    }

    disconnect(target: TargetBrowser) {
        const connectionIndex = this.getConnectionIndex(target);

        if (connectionIndex >= 0) {
            const target = this.connections[connectionIndex];

            target.connection.close(() => {
                this.connections.splice(connectionIndex, 1);
            });
        }
    }

    private getConnectionIndex(target: TargetBrowser) {
        return this.connections.findIndex(connection => connection.id === target.id);
    }

    private async getTargets(port: number): Promise<TargetDescription[]> {
        const targetUrl = `http://localhost:${port}/json`;

        try {
            const response = await axios.get(targetUrl);

            return response.data.filter((target: any) => target.type === 'page' && target.url.substr(0, 11) !== 'devtools://');
        } catch (e) {

        }

        return [];
    }

    private async connectToTarget(target: TargetBrowser) {
        const chrome = await CDP({
            port: target.port,
            target: target.id
        });

        const { Runtime, Network } = chrome;

        chrome.on('Inspector.detached', () => {
            this.disconnect(target);
        });

        await Promise.all([Runtime.enable(), Network.enable()]);

        Runtime.consoleAPICalled(({ args, type }: { type: 'log' | 'error' | 'info' | 'warn', args: any }) => {
            let logger = console[type];

            if (!logger) {
                logger = console.log;
            }

            if (Config.log) {
                logger.apply(console, args.map((a: any) => a.value));
            }
        });

        await Network.setRequestInterception({
            patterns: this.requests.map(req => ({
                urlPattern: req.uri,
                interceptionStage: 'Request'
            }))
        });

        Network.requestIntercepted(async ({ interceptionId, request }: any) => {
            const response = await interceptRequest(this.requests, request);

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

        return chrome;
    }
}