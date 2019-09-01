# ResponseRaider

Are you needing to modify the response to apply test or develop UI code, then ResponseRaider is your solution. There is no need to create an API server and mock your responses there, just specify the endpoint that needs to be intercepted along with the response and headers and you are all done.

## Usage

```typescript
import { intercept, ResponseInterceptorI } from '@floms-inc/response-raider';

const interceptors: ResponseInterceptorI[] = [
    // custom status code with request handler
    {
        uri: 'http://example.com/protected',
        handle: (request: RequestI) => {
            return {
                headers: [],
                body: {
                    authorized: false
                },
                status: 401
            };
        },
    },
    // standard 200 response code with request handler
    {
        uri: 'http://example.com/profile',
        handle: (request: RequestI) => {
            return {
                headers: [],
                body: {
                    firstName: 'Yoel',
                    lastName: 'Nunez',
                    time: new Date()
                }
            };
        },
    },
    // custom status code with static response object
    {
        uri: 'http://example.com/test',
        response: {
            body: {
                message: 'Hello World'
            },
            status: 201
        }
    }
];

intercept(interceptors).then(() => {
    console.log('launched');
});
```


## Advanced Usage

In the previous example every time a response mock is updated a browser restart will be required; this could be problematic if you have an application with protected resources that requires login everytime or if the flow you are testing is very complex and involves a lot of steps. To allow more flexibility and ease of use a dynamic response interceptor is available.

`main.ts`
```typescript
import { raid, interceptor } from '@floms-inc/response-raider';

interceptor().then(() => {
  raid('server.js');
});
```

`server.ts`
```typescript
import { interference } from '@floms-inc/response-raider';
import { RequestI } from '@floms-inc/response-raider/types';

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

To run this example, simply call `ts-node index.ts`