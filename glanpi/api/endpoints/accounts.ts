import { apiClient } from '../client';
import type { User } from '../types';

/**
 * Account endpoints. PROTECTED — require a Bearer token (attached automatically
 * by the request interceptor when the user is authenticated).
 */

/** Authenticated user's profile. */
export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/accounts/me/');
  return data;
}

/** Update mutable profile fields (phone and role are immutable server-side). */
export async function updateMe(
  body: Partial<Pick<User, 'email' | 'first_name' | 'last_name'>>,
): Promise<User> {
  const { data } = await apiClient.patch<User>('/accounts/me/', body);
  return data;
}
