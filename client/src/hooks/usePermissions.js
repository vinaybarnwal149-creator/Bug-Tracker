import { useAuth } from './useAuth.js';
import { can } from '../lib/permissions.js';

export function usePermissions(role) {
  const { user } = useAuth();

  const canDo = (action, resource = null) => {
    return can(role, action, resource, user?.id);
  };

  return {
    can: canDo,
    role,
    userId: user?.id
  };
}
