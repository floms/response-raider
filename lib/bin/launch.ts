#!/usr/bin/env node
import program from 'commander';
import { launch } from 'chrome-launcher';

import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Config } from '../util';

program
    .version('0.1.0')
    .arguments('<file>')
    .option('-p, --path <path>', 'browser user data path');

program.parse(process.argv);

const chromeFlags = [
    '--auto-open-devtools-for-tabs'
];

if (program.path) {
    chromeFlags.push(`--user-data-dir=${program.path}`);
}

const handleExit = () => {
    try {
        unlinkSync(Config.PATH)
    } catch (error) {
    }
};

(async () => {
    const chrome = await launch({
        chromeFlags
    });

    writeFileSync(Config.PATH, JSON.stringify({
        port: chrome.port,
        pid: chrome.pid
    }, null, 2));


    (<any> chrome.process)._handle.onexit = handleExit;
})();

process.once('SIGINT', handleExit);