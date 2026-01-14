
export enum CubeColor {
  WHITE = 'White',
  YELLOW = 'Yellow',
  RED = 'Red',
  ORANGE = 'Orange',
  BLUE = 'Blue',
  GREEN = 'Green'
}

export interface QuizState {
  front: CubeColor;
  top: CubeColor;
  correctLeft: CubeColor;
  correctRight: CubeColor;
}

export interface Statistics {
  total: number;
  correct: number;
  streak: number;
}
