import { User, Role, Permission } from '@prisma/client';

// Utilisateur étendu avec son rôle, sa pharmacie et sa succursale
export type UserWithRelations = User & {
  pharmacy?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  branch?: {
    id: string;
    name: string;
  } | null;
  userRoles: {
    role: Role & {
      rolePermissions: {
        permission: Permission
      }[]
    }
  }[]
};

// Structure de la session utilisateur dans NextAuth / JWT
export interface SessionUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  pharmacy_id: string;
  branchId?: string | null;
  roles: string[];
  permissions: string[];
}

// Type générique pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Type pour la pagination
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}