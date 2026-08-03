export * from '@prisma/client';
export interface SessionUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    pharmacyId: string;
    roles: string[];
    permissions: string[];
}
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: any;
    statusCode?: number;
    timestamp: string;
    requestId?: string;
}
