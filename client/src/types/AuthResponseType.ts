export type AuthResponseType = {
    success: boolean;
    code?: string;
    message?: string;
    statusCode?: number;
    data?: {
        token?: string;
        user?: any;
    };
    token?: string;
    timestamp?: string;
}