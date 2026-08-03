export declare enum SortOrder {
    ASC = "asc",
    DESC = "desc"
}
export declare class PaginationDto {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: SortOrder;
}
export declare class PaginatedResponseDto<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
    constructor(data: T[], total: number, page: number, limit: number);
}
