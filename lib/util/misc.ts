import { Minimatch } from 'minimatch';
import { RequestI, ResponseI } from '../types';

export const interceptRequest = async (requests: any[], request: RequestI): Promise<ResponseI | undefined> => {
    const handlerMatch = requests.find(mock => {
        const matcher = new Minimatch(mock.uri);

        return matcher.match(request.url || '');
    });

    if (handlerMatch) {
        let response: ResponseI | undefined = handlerMatch.response;

        if (handlerMatch.handle) {
            response = await handlerMatch.handle(((request: any): RequestI => {
                const requestObject = {
                    url: request.url,
                    method: request.method,
                    headers: Object.keys(request.headers || {}).map(
                        name => ({
                            name,
                            value: request.headers[name]
                        })
                    )
                };

                return requestObject;
            })(request));
        }

        return response;
    }
};