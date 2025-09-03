// Extend Express Request interface to include user property
declare namespace Express {
  interface Request {
    user?: {
      id: string;
      username: string;
      email: string;
      name: string;
      role: string;
      department: string;
      isActive: boolean;
      ldapSync: boolean;
    };
  }
}
