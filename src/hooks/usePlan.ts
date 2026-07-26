// src/hooks/usePlan.ts
import { useAuth } from '../context/AuthContext';

export function usePlan() {
  const { user } = useAuth();
  const plan = user?.plan ?? 'free';

  return {
    plan,
    isFree: plan === 'free',
    isPro: plan === 'pro' || plan === 'teams',
    isTeams: plan === 'teams',
    canUsePro: plan === 'pro' || plan === 'teams',
    canUseTeams: plan === 'teams',

    // File size limits
    maxFileSize: plan === 'teams' ? 1073741824   // 1GB
               : plan === 'pro'   ? 524288000    // 500MB
               :                    52428800,    // 50MB

    maxFileSizeLabel: plan === 'teams' ? '1GB'
                    : plan === 'pro'   ? '500MB'
                    :                    '50MB'
  };
}
