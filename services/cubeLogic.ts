
import { CubeColor } from '../types';
import { OPPOSITES, ROTATIONS } from '../constants';

/**
 * Given a Front face and a Top face, calculate the Left and Right faces.
 * Standard Western Color Scheme (Boy): W-Y, R-O, B-G
 */
export const getRelativeColors = (front: CubeColor, top: CubeColor): { left: CubeColor, right: CubeColor } => {
  // To find Right:
  // Look at the Top face. Its rotation sequence is its neighbors clockwise.
  const neighbors = ROTATIONS[top];
  const frontIdx = neighbors.indexOf(front);
  
  if (frontIdx === -1) {
    throw new Error(`Invalid orientation: ${front} cannot have ${top} on top.`);
  }

  // In the clockwise sequence around Top:
  // (Front, Right, Back, Left)
  const rightIdx = (frontIdx + 1) % 4;
  const leftIdx = (frontIdx + 3) % 4;

  return {
    right: neighbors[rightIdx],
    left: neighbors[leftIdx]
  };
};

export const getRandomColor = (colors: CubeColor[]): CubeColor => {
  return colors[Math.floor(Math.random() * colors.length)];
};

export const generateQuestion = (
  enabledColors: CubeColor[], 
  fixedTop: CubeColor | null = null
): { front: CubeColor, top: CubeColor, left: CubeColor, right: CubeColor } => {
  let top: CubeColor;
  let front: CubeColor;

  if (fixedTop && enabledColors.includes(fixedTop)) {
    top = fixedTop;
    // Front must be one of the neighbors of the fixed top
    const possibleFronts = ROTATIONS[top].filter(c => enabledColors.includes(c));
    
    if (possibleFronts.length === 0) {
      // Fallback: If no neighbors are enabled, we have to ignore the "enabled" constraint for front
      front = getRandomColor(ROTATIONS[top]);
    } else {
      front = getRandomColor(possibleFronts);
    }
  } else {
    // Original logic: random front and top
    front = getRandomColor(enabledColors);
    const possibleTops = enabledColors.filter(c => c !== front && c !== OPPOSITES[front]);
    
    if (possibleTops.length === 0) {
      const allTops = Object.values(CubeColor).filter(c => c !== front && c !== OPPOSITES[front]);
      top = getRandomColor(allTops);
    } else {
      top = getRandomColor(possibleTops);
    }
  }

  const { left, right } = getRelativeColors(front, top);
  return { front, top, left, right };
};
