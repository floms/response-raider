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

