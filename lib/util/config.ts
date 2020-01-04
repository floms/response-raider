import { readFileSync } from 'fs';
import { join } from 'path';

export class Config {
    public static HEADER = 'x-response-raider';
    public static PATH = join(process.cwd(), 'raid-config.json');;
    private static _log = false;

    static get log() {
        return Config._log;
    }

    static set log(enable: boolean) {
        Config._log = enable;
    }

    static get SERVER() {
        const port = 10001;

        const path = `/raid`;

        return {
            path,
            port,
            endpoint: `http://localhost:${port}${path}`
        };
    };

    static get RaidConfig() {
        try {
            return JSON.parse(readFileSync(Config.PATH, 'utf-8'));
        } catch (e) {
            process.exit(-1);
        }
    }
}