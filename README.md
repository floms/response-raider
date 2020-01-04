# ResponseRaider

Are you needing to modify the response to apply test or develop UI code, then ResponseRaider is your solution. There is no need to create an API server and mock your responses there, just specify the endpoint that needs to be intercepted along with the response and headers and you are all done.

## Installation

```sh
npm install @onefloms/response-raider
```

## Usage

Using ResponseRaider requires two steps: Step 1 launch a browser instance, Step 2 launch raid to intercept responses. The browser can be left open after modifying the request interceptors.

`package.json`
```json
{
  ...
  "scripts": {
    "launch": "launch -p /path/to/browser/user/data",
    "raid": "raid server.ts"
  }
  ...
}
```

`server.ts`
```typescript
import { interference } from '@onefloms/response-raider';
import { RequestI } from '@onefloms/response-raider/types';

const requests = [
    {
        uri: '**/profile',
        handle: async (request: RequestI) => {
            return await {
                body: {
                    firstName: 'Yoel',
                    lastName: 'Nunez',
                    website: 'http://www.nunez.guru/',
                }
            };
        },
    },
    {
        uri: '**/protected',
        response: {
            body: {
                message: 'user is not allowed'
            },
            status: 401
        }
    }
];

interference(requests).then(() => {
    console.log(`Response interference is active`);
});
```

To run this example, simply call `npm run launch` and `npm run raid`