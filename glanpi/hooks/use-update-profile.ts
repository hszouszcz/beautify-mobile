import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys, updateMe, type ApiError, type User } from '@/api';

/**
 * Update mutable profile fields (name/email). Used at the SMS step to attach the
 * customer's name to a just-created account so the salon always sees it.
 * Invalidates `me` so dependent screens re-read.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<
    User,
    ApiError,
    Partial<Pick<User, 'email' | 'first_name' | 'last_name'>>
  >({
    mutationFn: (body) => updateMe(body),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me(), user);
    },
  });
}
