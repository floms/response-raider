import * as _ from 'lodash';
import axios, { AxiosResponse } from 'axios';

import { ResponseInterceptorI, RequestI } from './types';
import { Config } from './util';
import { Debugger } from './util/debugger';

const debug = new Debugger();

export const intercept = async (interceptors: ResponseInterceptorI[]) => {
    debug.loadInterceptors(interceptors);

    debug.listen(Config.RaidConfig.port, 1000);
};

export const interceptor = async () => {

    const handleInterceptedResponse = (response: AxiosResponse) => {
        if (response.headers[Config.HEADER]) {
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

    return intercept([
        {
            uri: '**',
            handle: async (request: RequestI) => {

                try {
                    const response = await axios.post(Config.SERVER.endpoint, request);

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

