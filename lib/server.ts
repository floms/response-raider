import express from 'express';
import { interceptRequest, RaiderConfig } from './util';
import { ResponseInterceptorI } from './types';
const nodemon = require('nodemon');

export const interference = async (requests: ResponseInterceptorI[]) => {
    const app = express()

    app.use(express.json());

    const serverConfig = RaiderConfig.SERVER;

    app.post(serverConfig.path, async (req: any, res: any) => {
        const response = await interceptRequest(requests, req.body);

        if (response) {
            return res.status(response.status || 200).set({
                ...response.headers,
                [RaiderConfig.NAME]: true
            }).send(response.body);
        }

        res.end();
    });

    app.listen(serverConfig.port, () => console.log(`ResponseRaider server running on port ${serverConfig.port}!`))
};


export const raid = (script: string) => {
    nodemon({ script });

    nodemon
        .on('start', () => { })
        .on('quit', function () {
            process.exit();
        })
        .on('restart', function (files: any[]) {
            console.log('restarting.... ');
            console.log('changes detected on ', files);
        });
};