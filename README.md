# ResponseRaider

Are you needing to modify the response to apply test or develop UI code, then ResponseRaider is your solution. There is no need to create an API server and mock your responses there, just specify the endpoint that needs to be intercepted along with the response and headers and you are all done.

## Usage

```
import { intercept, ResponseInterceptorI } from '@floms-inc/response-raider';

const interceptors: ResponseInterceptorI[] = [
    {
        uri: '**/test',
        headers: [],
        body: {
            hello: 'world'
        }
    }
];

intercept(interceptors).then(() => {
    console.log('ResponseRaider is running....');
});
```

