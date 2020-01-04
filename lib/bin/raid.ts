#!/usr/bin/env node
import program from 'commander';
import { raid } from '../server';
import { interceptor } from '../browser';

let watchFile: string = '';

program
    .version('0.1.0')
    .arguments('<file>')
    .action((file: string) => {
        watchFile = file;
    });

program.parse(process.argv);

if (!watchFile) {
    console.error('[ERROR]: no file given!');
    process.exit(1);
}

interceptor().then(() => {
    raid(watchFile);
});