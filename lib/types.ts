export interface HeaderI {
    name: string;
    value: any;
}

export interface RequestI {
    url: string;
    method: string;
    headers: HeaderI[];
    body?: any;
}

export interface ResponseI {
    headers?: HeaderI[];
    body?: any;
    status?: number;
}

export interface ResponseInterceptorI {
    uri: string;
    response?: ResponseI;
    handle?: (body: RequestI) => Promise<ResponseI | undefined>
}