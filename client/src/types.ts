export type Point = [number, number, number];

export type DrawingStroke = {
  type: "stroke";
  color: string;
  size: number;
  points: Point[];
};

export type DrawingFill = {
  type: "fill";
  color: string;
  x: number;
  y: number;
};

export type DrawingAction = DrawingStroke | DrawingFill;
