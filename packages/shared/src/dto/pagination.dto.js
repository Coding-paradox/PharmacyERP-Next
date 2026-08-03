"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginatedResponseDto = exports.PaginationDto = exports.SortOrder = void 0;
var SortOrder;
(function (SortOrder) {
    SortOrder["ASC"] = "asc";
    SortOrder["DESC"] = "desc";
})(SortOrder || (exports.SortOrder = SortOrder = {}));
class PaginationDto {
    page = 1;
    limit = 20;
    search;
    sortBy = 'createdAt';
    sortOrder = SortOrder.DESC;
}
exports.PaginationDto = PaginationDto;
class PaginatedResponseDto {
    data;
    meta;
    constructor(data, total, page, limit) {
        this.data = data;
        this.meta = {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrevious: page > 1,
        };
    }
}
exports.PaginatedResponseDto = PaginatedResponseDto;
//# sourceMappingURL=pagination.dto.js.map