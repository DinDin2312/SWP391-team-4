import { Crown, Dumbbell, Flame, Layers, Package, Waves } from 'lucide-react';

export const TYPE_META = {
  GYM_ACCESS: { icon: Dumbbell, tone: 'gym', label: 'Gym access' },
  POOL_ACCESS: { icon: Waves, tone: 'pool', label: 'Pool access' },
  SAUNA_ACCESS: { icon: Flame, tone: 'sauna', label: 'Sauna access' },
  PREMIUM: { icon: Crown, tone: 'premium', label: 'Premium' },
  COMBO: { icon: Layers, tone: 'combo', label: 'Combo (Gym & Amenities)' },
};
const fallback = { icon: Package, tone: 'unknown', label: 'Other package type' };
export const typeMeta = type => TYPE_META[type] || fallback;
