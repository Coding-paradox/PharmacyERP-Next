import { User, Tenant, Branch, Role, Permission } from '@prisma/client'

// Utilisateur étendu avec son rôle, sa succursale et son tenant
export type UserWithRelations = User & {
  tenant: Tenant
  branch?: Branch | null
  userRoles: {
    role: Role & {
      rolePermissions: {
        permission: Permission
      }[]
    }
  }[]
}

// Structure de la session utilisateur dans NextAuth / JWT
export interface SessionUser {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  tenantId: string
  branchId?: string | null
  roles: string[]
  permissions: string[]
}

// Type générique pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Type pour la pagination
export interface PaginatedResult<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}