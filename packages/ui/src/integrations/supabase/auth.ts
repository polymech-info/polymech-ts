import { supabase } from './client';

/**
 * Retrieves the currently authenticated Supabase user.
 * @returns The user object or null if not authenticated.
 * @throws Throws an error if the user session cannot be retrieved.
 */
export const getSupabaseAuthUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting Supabase auth user:', error);
    throw new Error('Could not retrieve user session.');
  }
  return data.user;
};
