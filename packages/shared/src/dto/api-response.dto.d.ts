export declare class ApiResponseDto<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: any;
    statusCode?: number;
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
