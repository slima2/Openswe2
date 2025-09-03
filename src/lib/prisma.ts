// Mock Prisma Client for development
// This will be replaced with the actual Prisma client when the database is set up

export interface MockUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  department: string;
  isActive: boolean;
  ldapSync: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockMaterial {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  unitOfMeasure: string;
  unitPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel?: number;
  supplierInfo?: any;
  specifications?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockRequest {
  id: string;
  userId: string;
  materialId: string;
  quantity: number;
  totalAmount: number;
  costCenter: string;
  requiredDate: Date;
  justification: string;
  priority: string;
  status: string;
  isDraft: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockApproval {
  id: string;
  requestId: string;
  userId: string;
  status: string;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockAuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
  createdAt: Date;
}

class MockPrismaClient {
  user = {
    findUnique: async (params: any): Promise<MockUser | null> => {
      // Mock implementation
      return {
        id: 'mock-user-id',
        username: 'mockuser',
        email: 'mock@example.com',
        name: 'Mock User',
        role: 'user',
        department: 'IT',
        isActive: true,
        ldapSync: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    },
    update: async (params: any): Promise<MockUser> => {
      return {
        id: 'mock-user-id',
        username: 'mockuser',
        email: 'mock@example.com',
        name: 'Mock User',
        role: 'user',
        department: 'IT',
        isActive: true,
        ldapSync: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  };

  auditLog = {
    create: async (params: any): Promise<MockAuditLog> => {
      return {
        id: 'mock-audit-id',
        userId: 'mock-user-id',
        action: params.data.action,
        entityType: params.data.entityType,
        entityId: params.data.entityId,
        details: params.data.details,
        createdAt: new Date()
      };
    }
  };
}

export const prisma = new MockPrismaClient() as any;
