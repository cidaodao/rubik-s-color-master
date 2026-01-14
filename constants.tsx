
import React from 'react';
import { CubeColor } from './types';

export const COLOR_MAP: Record<CubeColor, string> = {
  [CubeColor.WHITE]: 'bg-[#FFFFFF] text-slate-900',
  [CubeColor.YELLOW]: 'bg-[#FFD500] text-slate-900',
  [CubeColor.RED]: 'bg-[#B71234] text-white',
  [CubeColor.ORANGE]: 'bg-[#FF5800] text-white',
  [CubeColor.BLUE]: 'bg-[#0046AD] text-white',
  [CubeColor.GREEN]: 'bg-[#009B48] text-white',
};

export const COLOR_DISPLAY_NAMES: Record<CubeColor, string> = {
  [CubeColor.WHITE]: '白色',
  [CubeColor.YELLOW]: '黄色',
  [CubeColor.RED]: '红色',
  [CubeColor.ORANGE]: '橙色',
  [CubeColor.BLUE]: '蓝色',
  [CubeColor.GREEN]: '绿色',
};

export const OPPOSITES: Record<CubeColor, CubeColor> = {
  [CubeColor.WHITE]: CubeColor.YELLOW,
  [CubeColor.YELLOW]: CubeColor.WHITE,
  [CubeColor.RED]: CubeColor.ORANGE,
  [CubeColor.ORANGE]: CubeColor.RED,
  [CubeColor.BLUE]: CubeColor.GREEN,
  [CubeColor.GREEN]: CubeColor.BLUE,
};

// Around sequences (Clockwise when looking from that face)
// If you look at 'White', sequence around it is Green -> Red -> Blue -> Orange
export const ROTATIONS: Record<CubeColor, CubeColor[]> = {
  [CubeColor.WHITE]: [CubeColor.GREEN, CubeColor.RED, CubeColor.BLUE, CubeColor.ORANGE],
  [CubeColor.YELLOW]: [CubeColor.GREEN, CubeColor.ORANGE, CubeColor.BLUE, CubeColor.RED],
  [CubeColor.RED]: [CubeColor.WHITE, CubeColor.BLUE, CubeColor.YELLOW, CubeColor.GREEN],
  [CubeColor.ORANGE]: [CubeColor.WHITE, CubeColor.GREEN, CubeColor.YELLOW, CubeColor.BLUE],
  [CubeColor.BLUE]: [CubeColor.WHITE, CubeColor.ORANGE, CubeColor.YELLOW, CubeColor.RED],
  [CubeColor.GREEN]: [CubeColor.WHITE, CubeColor.RED, CubeColor.YELLOW, CubeColor.ORANGE],
};
