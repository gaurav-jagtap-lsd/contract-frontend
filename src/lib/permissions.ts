import type { User } from '@/types';

export type AppRole = User['role'];

export function normalizeRole(role?: string | null): AppRole {
  if (role === 'admin' || role === 'editor') return role;
  return 'viewer';
}

export function canWrite(role?: string | null): boolean {
  const value = normalizeRole(role);
  return value === 'admin' || value === 'editor';
}

export function canDelete(role?: string | null): boolean {
  return normalizeRole(role) === 'admin';
}

export function canManageUsers(role?: string | null): boolean {
  return normalizeRole(role) === 'admin';
}

export function roleLabel(role?: string | null): string {
  const value = normalizeRole(role);
  if (value === 'admin') return 'Admin';
  if (value === 'editor') return 'Editor';
  return 'Viewer';
}
