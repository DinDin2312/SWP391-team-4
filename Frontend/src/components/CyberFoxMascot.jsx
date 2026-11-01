import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { t, useLanguage } from '../i18n/useLanguage';

export const FOX_DIRECTIONS = [
  'DIRECT_HOVER',
  'FAR_LEFT',
  'LOW_LEFT',
  'MID_LEFT',
  'DIAG_CENTER',
  'HIGH_LEFT',
  'STRAIGHT_UP',
  'NEAR_LEFT',
  'NEAR_UP',
];

/**
 * Resolves 1 of 9 discrete Fox head frames based on the user's Blue Circle & Red Area diagram:
 * - Blue Circle (Fox at bottom-right corner): When hovered or cursor is within the Fox button radius,
 *   returns 'DIRECT_HOVER' (Fox looks straight ahead at the user).
 * - Red Area (Entire viewport to the left and above the Fox, 0°..90° fan):
 *   Calculates vector from Fox center (foxX, foxY) to cursor (clientX, clientY) and maps
 *   into 8 dedicated directional frames across the Red Area.
 */
export function resolveFoxDirection(
  clientX,
  clientY,
  foxCenterX,
  foxCenterY,
  isHovered = false
) {
  if (isHovered) {
    return 'DIRECT_HOVER';
  }

  if (
    typeof clientX !== 'number' ||
    typeof clientY !== 'number' ||
    typeof foxCenterX !== 'number' ||
    typeof foxCenterY !== 'number'
  ) {
    return 'DIRECT_HOVER';
  }

  const rawDx = foxCenterX - clientX;
  const rawDy = foxCenterY - clientY;
  const dist = Math.hypot(rawDx, rawDy);

  // Inside the Blue Circle (cursor directly on the Fox button)
  if (dist <= 38) {
    return 'DIRECT_HOVER';
  }

  // Clamp into the Red Area quadrant (left and above the bottom-right Fox)
  const dx = Math.max(0, rawDx);
  const dy = Math.max(0, rawDy);
  const thetaDeg = (Math.atan2(dy, dx) * 180) / Math.PI; // 0° (pure left) -> 90° (pure up)

  // Close-range ring (< 180px from Fox center)
  if (dist < 180) {
    return thetaDeg < 45 ? 'NEAR_LEFT' : 'NEAR_UP';
  }

  // Mid/Far range across the Red Area (6 radial sectors from 0° to 90°)
  if (thetaDeg < 15) return 'FAR_LEFT';
  if (thetaDeg < 30) return 'LOW_LEFT';
  if (thetaDeg < 45) return 'MID_LEFT';
  if (thetaDeg < 60) return 'DIAG_CENTER';
  if (thetaDeg < 75) return 'HIGH_LEFT';
  return 'STRAIGHT_UP';
}

/**
 * 9-Frame 3D Pose Angles for the Complete Volumetric Low-Poly Cyber Fox Head & Bust.
 * - yaw: negative rotates the 3D skull, snout, and ears to the LEFT, exposing the right cranium & back of skull.
 * - pitch: negative tilts the 3D snout and chin UPWARD, exposing the 3D under-jaw and elongated throat/neck bust.
 * - roll: subtle natural head banking.
 */
const POSE_3D_ANGLES = {
  DIRECT_HOVER: { yaw: 0, pitch: 0, roll: 0 },
  FAR_LEFT: { yaw: -52, pitch: -4, roll: -4 },
  LOW_LEFT: { yaw: -46, pitch: -14, roll: -5 },
  MID_LEFT: { yaw: -38, pitch: -24, roll: -6 },
  DIAG_CENTER: { yaw: -28, pitch: -33, roll: -5 },
  HIGH_LEFT: { yaw: -16, pitch: -40, roll: -3 },
  STRAIGHT_UP: { yaw: -5, pitch: -44, roll: -1 },
  NEAR_LEFT: { yaw: -35, pitch: -8, roll: -4 },
  NEAR_UP: { yaw: -12, pitch: -30, roll: -2 },
};

/**
 * Complete Volumetric 3D Low-Poly Cyber Fox Head + Cranium + Under-Jaw + Neck Bust
 * in a 120x120 viewBox.
 *
 * Each vertex has [x, y, z, weight]:
 * - weight = 1.0: Full 3D skull/face vertex (rotates with head yaw/pitch/roll).
 * - weight = 0.45: Articulated upper neck/under-jaw junction (bridges skull to neck bust).
 * - weight = 0.12: Anchored base of the neck/chest ruff (stays grounded at the bottom of the circle
 *   so the Fox always has a solid neck & bust and NEVER looks like a floating flat mask).
 */
const VERTICES_3D = {
  // Top Cranium & Back-of-Skull Dome (z < 0 so the back of the head expands into view when turning left/up)
  SKULL_TOP: [60, 26, -6, 1.0],
  L_SKULL_BACK: [22, 42, -24, 0.85],
  R_SKULL_BACK: [98, 42, -28, 0.85],
  R_OCCIPITAL: [99, 66, -26, 0.75],

  // Left Ear (Far-side ear when turning left)
  L_EAR_TIP: [21, 9, -16, 1.0],
  L_EAR_BACK_OUT: [19, 32, -20, 1.0],
  L_CHEEK_TOP: [24, 46, 2, 1.0],
  L_CROWN: [47, 31, 10, 1.0],
  L_EAR_IN_TOP: [31, 25, -10, 1.0],
  L_EAR_IN_OUT: [28, 37, -6, 1.0],
  L_EAR_IN_IN: [36, 40, -2, 1.0],

  // Right Ear (Near-side ear when turning left — includes 3D outer back shell)
  R_EAR_TIP: [99, 9, -16, 1.0],
  R_EAR_BACK_OUT: [101, 32, -22, 1.0],
  R_CHEEK_TOP: [96, 46, 2, 1.0],
  R_CROWN: [73, 31, 10, 1.0],
  R_EAR_IN_TOP: [89, 25, -10, 1.0],
  R_EAR_IN_OUT: [92, 37, -6, 1.0],
  R_EAR_IN_IN: [84, 40, -2, 1.0],

  // Center Forehead V-Notch & 3D Snout Ridge
  C_NOTCH: [60, 36, 16, 1.0],
  C_BRIDGE_MID: [60, 61, 30, 1.0],

  // Left Eye Triangle
  L_EYE_TOP: [40, 48, 20, 1.0],
  L_EYE_OUT: [34, 57, 16, 1.0],
  L_EYE_IN: [49, 57, 24, 1.0],

  // Right Eye Triangle
  R_EYE_TOP: [80, 48, 20, 1.0],
  R_EYE_OUT: [86, 57, 16, 1.0],
  R_EYE_IN: [71, 57, 24, 1.0],

  // Left Outer Jowl & Cheek
  L_JOWL_OUT: [19, 64, -4, 1.0],
  L_CHEEK_MID: [33, 71, 10, 1.0],
  L_JOWL_BOT: [33, 83, 2, 0.9],
  L_JOWL_IN: [44, 84, 16, 0.95],

  // Right Outer Jowl & Cheek
  R_JOWL_OUT: [101, 64, -4, 1.0],
  R_CHEEK_MID: [87, 71, 10, 1.0],
  R_JOWL_BOT: [87, 83, 2, 0.9],
  R_JOWL_IN: [76, 84, 16, 0.95],

  // Protruding 3D Snout & Faceted Nose Tip (High positive Z: +32 to +46)
  L_SNOUT_MID: [51, 74, 32, 1.0],
  R_SNOUT_MID: [69, 74, 32, 1.0],
  L_NOSE_TOP: [53, 83, 41, 1.0],
  C_NOSE_TOP: [60, 81, 44, 1.0],
  R_NOSE_TOP: [67, 83, 41, 1.0],
  L_NOSE_BOT: [53, 89, 43, 1.0],
  C_NOSE_MID: [60, 87, 46, 1.0],
  C_NOSE_BOT: [60, 93, 44, 1.0],
  R_NOSE_BOT: [67, 89, 43, 1.0],

  // Upper Chin & Articulated 3D Under-Jaw (opens into full 3D underside plane when looking up!)
  C_CHIN: [60, 97, 36, 1.0],
  L_JAW_UNDER: [47, 92, 8, 0.55],
  C_JAW_UNDER: [60, 99, 10, 0.5],
  R_JAW_UNDER: [73, 92, 8, 0.55],

  // Sculpted Low-Poly Neck & Chest Ruff Bust (grounded at bottom of avatar)
  NECK_L_OUT: [27, 95, -10, 0.2],
  NECK_L_BOT: [42, 107, 2, 0.15],
  NECK_C_MID: [60, 106, 8, 0.25],
  NECK_C_BOT: [60, 115, 4, 0.1],
  NECK_R_BOT: [78, 107, 2, 0.15],
  NECK_R_OUT: [93, 95, -16, 0.25],
};

/**
 * Watertight Low-Poly Facets in the NEXUS Electric Blue & Cyber Indigo Palette:
 * - Lit Forehead & Snout Bridge: #38BDF8 / #0EA5E9 (Electric Cyan-Blue)
 * - Mid-Tone Ear Ridges, Brow & Right Snout: #0284C7 / #0071E3 (NEXUS Royal Blue)
 * - Outer Jowls & Cranium Dome: #1D4ED8 / #1E40AF (Cyber Cobalt)
 * - Side/Back Skull & Occipital Fur (visible when turning left): #1E3A8A / #172554 (Deep Cyber Indigo)
 * - Outer Ears & Sculpted Neck Bust: #0F172A / #1E293B / #090D16 (Obsidian Navy)
 * - Cheeks & Inner Ears: #F8FAFC / #E2E8F0 / #CBD5E1 (Crisp Ice-White & Silver)
 * - 3D Under-Jaw (visible when tilting up): #94A3B8 / #64748B (Shaded Cool Silver-Slate)
 */
const LOW_POLY_FACETS = [
  // 0. Sculpted Low-Poly Neck & Chest Ruff Bust (Base Layer)
  {
    id: 'neck-left-outer',
    verts: ['L_JOWL_BOT', 'L_JOWL_IN', 'L_JAW_UNDER', 'NECK_L_BOT', 'NECK_L_OUT'],
    fill: '#0F172A',
  },
  {
    id: 'neck-throat-left',
    verts: ['L_JAW_UNDER', 'C_JAW_UNDER', 'NECK_C_MID', 'NECK_L_BOT'],
    fill: '#1E293B',
  },
  {
    id: 'neck-throat-right',
    verts: ['C_JAW_UNDER', 'R_JAW_UNDER', 'NECK_R_BOT', 'NECK_C_MID'],
    fill: '#0F172A',
  },
  {
    id: 'neck-chest-point',
    verts: ['NECK_L_BOT', 'NECK_C_MID', 'NECK_R_BOT', 'NECK_C_BOT'],
    fill: '#090D16',
  },
  {
    id: 'neck-right-outer',
    verts: ['R_JAW_UNDER', 'R_JOWL_IN', 'R_JOWL_BOT', 'NECK_R_OUT', 'NECK_R_BOT'],
    fill: '#172554',
  },

  // 1. 3D Cranium Dome & Back/Side of Skull (Fills out the head volume in 3/4 and upward views)
  {
    id: 'skull-dome-left',
    verts: ['SKULL_TOP', 'L_CROWN', 'C_NOTCH'],
    fill: '#0284C7',
  },
  {
    id: 'skull-dome-right',
    verts: ['SKULL_TOP', 'C_NOTCH', 'R_CROWN'],
    fill: '#1D4ED8',
  },
  {
    id: 'skull-side-left',
    verts: ['L_CROWN', 'L_SKULL_BACK', 'L_CHEEK_TOP'],
    fill: '#1E3A8A',
  },
  {
    id: 'skull-back-upper-right',
    verts: ['R_CROWN', 'R_EAR_BACK_OUT', 'R_SKULL_BACK', 'R_CHEEK_TOP'],
    fill: '#1E3A8A',
  },
  {
    id: 'skull-back-mid-right',
    verts: ['R_CHEEK_TOP', 'R_SKULL_BACK', 'R_OCCIPITAL', 'R_JOWL_OUT'],
    fill: '#1E40AF',
  },
  {
    id: 'skull-back-lower-right',
    verts: ['R_JOWL_OUT', 'R_OCCIPITAL', 'NECK_R_OUT', 'R_JOWL_BOT'],
    fill: '#172554',
  },

  // 2. Left Ear (Far-side ear when turning left)
  {
    id: 'l-ear-back-shell',
    verts: ['L_EAR_TIP', 'L_EAR_BACK_OUT', 'L_CHEEK_TOP'],
    fill: '#090D16',
  },
  {
    id: 'l-ear-outer-dark',
    verts: ['L_EAR_TIP', 'L_CHEEK_TOP', 'L_EAR_IN_OUT', 'L_EAR_IN_TOP'],
    fill: '#0F172A',
  },
  {
    id: 'l-ear-inner-silver',
    verts: ['L_EAR_IN_TOP', 'L_EAR_IN_OUT', 'L_EAR_IN_IN'],
    fill: '#CBD5E1',
  },
  {
    id: 'l-ear-ridge-blue',
    verts: ['L_EAR_TIP', 'L_CROWN', 'L_CHEEK_TOP', 'L_EAR_IN_IN', 'L_EAR_IN_TOP'],
    fill: '#0284C7',
  },

  // 3. Right Ear (Near-side ear when turning left)
  {
    id: 'r-ear-back-shell',
    verts: ['R_EAR_TIP', 'R_EAR_BACK_OUT', 'R_CHEEK_TOP'],
    fill: '#090D16',
  },
  {
    id: 'r-ear-outer-dark',
    verts: ['R_EAR_TIP', 'R_CHEEK_TOP', 'R_EAR_IN_OUT', 'R_EAR_IN_TOP'],
    fill: '#0F172A',
  },
  {
    id: 'r-ear-inner-silver',
    verts: ['R_EAR_IN_TOP', 'R_EAR_IN_OUT', 'R_EAR_IN_IN'],
    fill: '#E2E8F0',
  },
  {
    id: 'r-ear-ridge-blue',
    verts: ['R_EAR_TIP', 'R_CROWN', 'R_CHEEK_TOP', 'R_EAR_IN_IN', 'R_EAR_IN_TOP'],
    fill: '#0071E3',
  },

  // 4. 3D Under-Jaw / Chin Underside (Opens into full 3D lower jaw when tilting up!)
  {
    id: 'under-jaw-left',
    verts: ['L_JOWL_IN', 'C_CHIN', 'C_JAW_UNDER', 'L_JAW_UNDER'],
    fill: '#94A3B8',
  },
  {
    id: 'under-jaw-right',
    verts: ['R_JOWL_IN', 'C_CHIN', 'C_JAW_UNDER', 'R_JAW_UNDER'],
    fill: '#64748B',
  },

  // 5. Left Outer Jowl & Ice-White Cheek (Far side when turning left)
  {
    id: 'l-jowl-outer',
    verts: ['L_CHEEK_TOP', 'L_JOWL_OUT', 'L_JOWL_BOT', 'L_JOWL_IN', 'L_CHEEK_MID'],
    fill: '#1D4ED8',
  },
  {
    id: 'l-cheek-white',
    verts: [
      'L_CHEEK_TOP',
      'L_EYE_OUT',
      'L_SNOUT_MID',
      'L_NOSE_TOP',
      'L_NOSE_BOT',
      'C_CHIN',
      'L_JOWL_IN',
      'L_CHEEK_MID',
    ],
    fill: '#E2E8F0',
  },
  {
    id: 'l-brow-blue',
    verts: ['L_CHEEK_TOP', 'L_EYE_TOP', 'L_EYE_OUT'],
    fill: '#0284C7',
  },
  {
    id: 'l-undereye-blue',
    verts: ['L_EYE_OUT', 'L_EYE_IN', 'L_SNOUT_MID'],
    fill: '#0369A1',
  },

  // 6. Right Outer Jowl & Crisp White Cheek (Near side when turning left)
  {
    id: 'r-jowl-outer',
    verts: ['R_CHEEK_TOP', 'R_JOWL_OUT', 'R_JOWL_BOT', 'R_JOWL_IN', 'R_CHEEK_MID'],
    fill: '#1E40AF',
  },
  {
    id: 'r-cheek-white',
    verts: [
      'R_CHEEK_TOP',
      'R_EYE_OUT',
      'R_SNOUT_MID',
      'R_NOSE_TOP',
      'R_NOSE_BOT',
      'C_CHIN',
      'R_JOWL_IN',
      'R_CHEEK_MID',
    ],
    fill: '#F8FAFC',
  },
  {
    id: 'r-brow-blue',
    verts: ['R_CHEEK_TOP', 'R_EYE_TOP', 'R_EYE_OUT'],
    fill: '#0284C7',
  },
  {
    id: 'r-undereye-blue',
    verts: ['R_EYE_OUT', 'R_EYE_IN', 'R_SNOUT_MID'],
    fill: '#0071E3',
  },

  // 7. Split 3D Central Forehead & Protruding Snout Bridge (Electric Cyan-Blue & NEXUS Blue)
  {
    id: 'forehead-left',
    verts: ['L_CHEEK_TOP', 'L_CROWN', 'C_NOTCH', 'C_BRIDGE_MID', 'L_EYE_IN', 'L_EYE_TOP'],
    fill: '#38BDF8',
  },
  {
    id: 'forehead-right',
    verts: ['R_CHEEK_TOP', 'R_CROWN', 'C_NOTCH', 'C_BRIDGE_MID', 'R_EYE_IN', 'R_EYE_TOP'],
    fill: '#0EA5E9',
  },
  {
    id: 'snout-bridge-left',
    verts: ['L_EYE_IN', 'C_BRIDGE_MID', 'C_NOSE_TOP', 'L_NOSE_TOP', 'L_SNOUT_MID'],
    fill: '#38BDF8',
  },
  {
    id: 'snout-bridge-right',
    verts: ['R_EYE_IN', 'C_BRIDGE_MID', 'C_NOSE_TOP', 'R_NOSE_TOP', 'R_SNOUT_MID'],
    fill: '#0284C7',
  },

  // 8. Crisp Geometric Triangular Eyes
  {
    id: 'l-eye-triangle',
    verts: ['L_EYE_TOP', 'L_EYE_IN', 'L_EYE_OUT'],
    fill: '#090D16',
  },
  {
    id: 'r-eye-triangle',
    verts: ['R_EYE_TOP', 'R_EYE_IN', 'R_EYE_OUT'],
    fill: '#090D16',
  },

  // 9. 3D Faceted Nose Tip (Highest Z priority)
  {
    id: 'nose-top-left',
    verts: ['L_NOSE_TOP', 'C_NOSE_TOP', 'C_NOSE_MID', 'L_NOSE_BOT'],
    fill: '#1E293B',
  },
  {
    id: 'nose-top-right',
    verts: ['C_NOSE_TOP', 'R_NOSE_TOP', 'R_NOSE_BOT', 'C_NOSE_MID'],
    fill: '#0F172A',
  },
  {
    id: 'nose-bottom-tip',
    verts: ['L_NOSE_BOT', 'C_NOSE_MID', 'R_NOSE_BOT', 'C_NOSE_BOT'],
    fill: '#020617',
  },
];

/**
 * Projects a weighted 3D vertex [x, y, z, weight] around the Fox skull pivot (60, 56, 12)
 * without vertical pancake-foreshortening:
 * - Preserves vertical skull height so the head NEVER squishes into a thin mask when pitching up.
 * - Uses Z-depth parallax relative to the skull core (z=12) so the snout lifts/turns strongly
 *   while the back cranium (-28), under-jaw (+8), and grounded neck bust fill out the complete 3D head.
 */
function projectVertex3D([x, y, z, weight = 1.0], yawDeg, pitchDeg, rollDeg) {
  const pivotX = 60;
  const pivotY = 56;
  const pivotZ = 12;

  const w = weight;
  const yaw = ((yawDeg * w) * Math.PI) / 180;
  const pitch = ((pitchDeg * w) * Math.PI) / 180;
  const roll = ((rollDeg * w) * Math.PI) / 180;

  const dx = x - pivotX;
  const dy = y - pivotY;
  const dz = z - pivotZ;

  // 1. Yaw rotation around Y-axis: turns snout left while swinging back-of-skull (dz < 0) right
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = dx * cosY + dz * sinY;
  const z1 = -dx * sinY + dz * cosY;

  // 2. Non-squishing Pitch rotation: preserves 92% of vertical skull height while applying
  //    strong 3D depth-lift (dz * sinP) to the protruding snout and nose!
  const sinP = Math.sin(pitch);
  const verticalPreserve = 1 - (1 - Math.cos(pitch)) * 0.25;
  const y2 = dy * verticalPreserve + dz * sinP * 0.72;
  const x2 = x1;

  // 3. Subtle Roll rotation around Z-axis
  const cosR = Math.cos(roll);
  const sinR = Math.sin(roll);
  const x3 = x2 * cosR - y2 * sinR;
  const y3 = x2 * sinR + y2 * cosR;

  // Whole-head translation shift weighted by vertex articulation
  const shiftX = yawDeg * 0.08 * w;
  const shiftY = pitchDeg * 0.06 * w;

  return [
    Number((pivotX + x3 + shiftX).toFixed(2)),
    Number((pivotY + y3 + shiftY).toFixed(2)),
    z1,
  ];
}

/**
 * Reusable Volumetric Low-Poly Cyber Fox Avatar SVG component.
 * Renders the 9 distinct 3D Low-Poly Fox frames based on `direction`.
 */
export const CyberFoxAvatar = memo(({
  direction = 'DIRECT_HOVER',
  className = 'w-12 h-12',
  isHovered = false,
}) => {
  const pose = POSE_3D_ANGLES[direction] || POSE_3D_ANGLES.DIRECT_HOVER;

  // Project all 3D vertices for the active frame
  const projected = {};
  for (const [key, coords] of Object.entries(VERTICES_3D)) {
    projected[key] = projectVertex3D(coords, pose.yaw, pose.pitch, pose.roll);
  }

  // Compute eye glint & cyber cyan shard positions inside the triangular eyes
  const lEyeCenter = [
    (projected.L_EYE_TOP[0] + projected.L_EYE_IN[0] + projected.L_EYE_OUT[0]) / 3,
    (projected.L_EYE_TOP[1] + projected.L_EYE_IN[1] + projected.L_EYE_OUT[1]) / 3,
  ];
  const rEyeCenter = [
    (projected.R_EYE_TOP[0] + projected.R_EYE_IN[0] + projected.R_EYE_OUT[0]) / 3,
    (projected.R_EYE_TOP[1] + projected.R_EYE_IN[1] + projected.R_EYE_OUT[1]) / 3,
  ];

  // Low-poly inner cyan iris shard inside each eye triangle
  const lIrisShard = `${(projected.L_EYE_TOP[0] + lEyeCenter[0]) / 2},${(projected.L_EYE_TOP[1] + lEyeCenter[1]) / 2} ${projected.L_EYE_IN[0] - 1.5},${projected.L_EYE_IN[1] - 0.8} ${lEyeCenter[0] - 1.2},${lEyeCenter[1] + 1.2}`;
  const rIrisShard = `${(projected.R_EYE_TOP[0] + rEyeCenter[0]) / 2},${(projected.R_EYE_TOP[1] + rEyeCenter[1]) / 2} ${projected.R_EYE_IN[0] + 1.5},${projected.R_EYE_IN[1] - 0.8} ${rEyeCenter[0] + 1.2},${rEyeCenter[1] + 1.2}`;

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} select-none overflow-visible`}
      aria-hidden="true"
    >
      <g
        style={{
          transition: 'transform 140ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {LOW_POLY_FACETS.map((facet) => {
          const pointsStr = facet.verts
            .map((vKey) => `${projected[vKey][0]},${projected[vKey][1]}`)
            .join(' ');
          return (
            <polygon
              key={facet.id}
              points={pointsStr}
              fill={facet.fill}
              stroke={facet.fill}
              strokeWidth="0.5"
              strokeLinejoin="round"
              style={{
                transition: 'all 130ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />
          );
        })}

        {/* Cyber Cyan Low-Poly Eye Shards */}
        <polygon
          points={lIrisShard}
          fill="#22D3EE"
          opacity="0.92"
          style={{ transition: 'all 130ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
        <polygon
          points={rIrisShard}
          fill="#22D3EE"
          opacity="0.92"
          style={{ transition: 'all 130ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />

        {/* Crisp white eye glints */}
        <circle
          cx={lEyeCenter[0] + (direction === 'DIRECT_HOVER' ? 0.6 : -0.6)}
          cy={lEyeCenter[1] - 0.8}
          r="1.25"
          fill="#FFFFFF"
          opacity="0.95"
        />
        <circle
          cx={rEyeCenter[0] - 0.6}
          cy={rEyeCenter[1] - 0.8}
          r="1.25"
          fill="#FFFFFF"
          opacity="0.95"
        />
      </g>
    </svg>
  );
});

CyberFoxAvatar.displayName = 'CyberFoxAvatar';

/**
 * Floating Bottom-Right Low-Poly Cyber Fox Mascot Widget.
 * - Sits at `fixed bottom-6 right-6 z-40`.
 * - Tracks global cursor position using `requestAnimationFrame` + discrete 9-state updates
 *   so parent layouts (`MemberLayout` / `CoachLayout` / `AutoSidebar`) NEVER re-render on mousemove.
 * - Uses `pointer-events-none` on outer containers and speech bubble, and `pointer-events-auto`
 *   ONLY on the 68x68px circular Fox button so page elements are never blocked.
 */
const CyberFoxMascot = memo(({
  isVisible = true,
  onActivate,
  label = 'Ask NEXUS AI',
}) => {
  useLanguage();
  const [direction, setDirection] = useState('MID_LEFT');
  const [isHovered, setIsHovered] = useState(false);

  const buttonRef = useRef(null);
  const directionRef = useRef('MID_LEFT');
  const isHoveredRef = useRef(false);
  const rafIdRef = useRef(null);
  const anchorCenterRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isVisible || typeof window === 'undefined') return undefined;

    const updateAnchorCenter = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        anchorCenterRef.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      } else {
        anchorCenterRef.current = {
          x: window.innerWidth - 56,
          y: window.innerHeight - 56,
        };
      }
    };

    updateAnchorCenter();

    const handleMouseMove = (event) => {
      if (rafIdRef.current !== null) return;
      const { clientX, clientY } = event;

      rafIdRef.current = window.requestAnimationFrame(() => {
        rafIdRef.current = null;
        const { x: foxX, y: foxY } = anchorCenterRef.current;
        const nextDir = resolveFoxDirection(
          clientX,
          clientY,
          foxX,
          foxY,
          isHoveredRef.current
        );

        if (nextDir !== directionRef.current) {
          directionRef.current = nextDir;
          setDirection(nextDir);
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', updateAnchorCenter, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', updateAnchorCenter);
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isVisible]);

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
    directionRef.current = 'DIRECT_HOVER';
    setIsHovered(true);
    setDirection('DIRECT_HOVER');
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    setIsHovered(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="cyber-fox-floating-widget"
          initial={{ opacity: 0, scale: 0.25, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.2, y: 20 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          className="fixed bottom-6 right-6 z-40 pointer-events-none select-none flex items-center"
        >
          {/* Hover Speech Bubble (Strictly pointer-events-none so it never intercepts clicks) */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                key="cyber-fox-speech-bubble"
                initial={{ opacity: 0, x: 12, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                className="pointer-events-none mr-3.5 px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 text-white border border-sky-400/45 shadow-[0_12px_32px_rgba(14,165,233,0.32)] backdrop-blur-xl max-w-[240px] relative"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-400 mb-0.5">
                  <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />
                  <span>{label}</span>
                </div>
                <p className="text-xs font-medium text-slate-100 leading-snug">
                  {t('Have a question? Ask me anything!')}
                </p>
                {/* Speech Bubble Tail pointing right to the Fox */}
                <span className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-slate-900 dark:bg-slate-950 border-t border-r border-sky-400/45 rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive 68x68px Fox Avatar Button (Blue Circle in diagram) */}
          <button
            ref={buttonRef}
            type="button"
            onClick={onActivate}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            aria-label={t('Have a question? Ask me anything!')}
            className="pointer-events-auto relative w-[68px] h-[68px] rounded-full bg-gradient-to-br from-slate-900 via-[#0B1736] to-slate-950 border-2 border-sky-400/65 hover:border-cyan-300 shadow-[0_10px_28px_rgba(14,165,233,0.38)] hover:shadow-[0_12px_36px_rgba(34,211,238,0.55)] flex items-center justify-center transition-transform duration-200 hover:scale-108 active:scale-95 cursor-pointer group"
          >
            {/* Subtle glowing ring (pointer-events-none) */}
            <span className="pointer-events-none absolute -inset-1 rounded-full bg-gradient-to-r from-sky-500/25 via-blue-600/25 to-indigo-500/25 blur-sm opacity-80 group-hover:opacity-100 transition-opacity" />

            <CyberFoxAvatar
              direction={direction}
              isHovered={isHovered}
              className="w-[60px] h-[60px] relative z-10 pointer-events-none"
            />

            {/* Online AI Status Dot */}
            <span className="pointer-events-none absolute bottom-0.5 right-0.5 z-20 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-950 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

CyberFoxMascot.displayName = 'CyberFoxMascot';

export default CyberFoxMascot;
