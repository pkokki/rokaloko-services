import { ServerInjectResponse } from 'hapi';
import { serverInject } from '../src/server';

export const regexObjectId = /^[a-f\d]{24}$/i;

export function regexUrlWithObjectId(url: string) {
    return new RegExp('^' + url + '\\/' + '[a-f\\d]{24}$');
};

export function serverRequest(method: string, url: string, payload: string | Buffer | object = undefined): Promise<ServerInjectResponse> {
    return serverInject({ method: method, url: url /*, headers: validHeaders*/, payload: payload });
}

export const RESPONSE_PAYLOADS = {
    BadRequest_400: {
        'statusCode': 400,
        'error': 'Bad Request',
        'message': 'Invalid request payload input',
    },
    Unauthorized_401: {
        'statusCode': 401,
        'error': 'Unauthorized',
        'message': 'Unauthorized',
    },
    MissingAuth_401: {
        'statusCode': 401,
        'error': 'Unauthorized',
        'message': 'Missing authentication',
    },
    InvalidToken_401: {
        'statusCode': 401,
        'error': 'Unauthorized',
        'message': 'Invalid token',
    },
    NotFound_404: {
        'statusCode': 404,
        'error': 'Not Found',
        'message': 'Not Found',
    },
    MethodNotAllowed_405: {
        'statusCode': 405,
        'error': 'Method Not Allowed',
        'message': 'This resource isn’t available.',
    }
};