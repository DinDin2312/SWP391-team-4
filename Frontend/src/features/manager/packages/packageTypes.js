import { Bot, Crown, Dumbbell, Layers, Package } from 'lucide-react';

export const TYPE_META = {
  GYM_ACCESS: { icon: Dumbbell, tone: 'gym', label: 'Gym access' },
  AI_ACCESS: { icon: Bot, tone: 'ai', label: 'AI access' },
  PREMIUM: { icon: Crown, tone: 'premium', label: 'Premium' },
  COMBO: { icon: Layers, tone: 'combo', label: 'Combo (Gym + AI)' },
  SUBJECT_ACCESS: { icon: Layers, tone: 'combo', label: 'Subject package' },
};
const fallback = { icon: Package, tone: 'unknown', label: 'Other package type' };
export const typeMeta = type => TYPE_META[type] || fallback;
