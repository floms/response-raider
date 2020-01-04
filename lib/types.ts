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

export interface TargetBrowser {
    port: number;
    id: string;
}

export interface TargetBrowserConnection extends TargetBrowser {
    connection: any;
}

export interface TargetDescription {
    description: string;
    devtoolsFrontendUrl: string;
    id: string;
    title: string;
    type: string;
    url: string;
    webSocketDebuggerUrl: string;
}