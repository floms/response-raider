#!/usr/bin/env node
import program from 'commander';
import { raid } from '../server';
import { interceptor } from '../browser';

let watchFile: string = '';

program
    .version('0.1.0')
    .arguments('<file>')
    .option('-e, --extensions <type>', 'file extensions to watch', (val: string) => val.split(','))
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