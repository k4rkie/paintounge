import { useCallback, useEffect, useRef, useState } from "react";
import { getStroke } from "perfect-freehand";
import type { DrawingAction, DrawingFill, DrawingStroke, Point } from "../types";
import DrawingToolbar from "./DrawingToolbar";

const DEFAULT_COLOR = "#171717";
const DEFAULT_SIZE = 8;

function drawStroke(context: CanvasRenderingContext2D, stroke: DrawingStroke) {
  if (stroke.points.length === 0) {
    return;
  }

  const outline = getStroke(stroke.points, {
    size: stroke.size,
    thinning: 0,
    smoothing: 0.18,
    streamline: 0.12,
    easing: (value) => value,
  });

  context.beginPath();
  context.moveTo(outline[0][0], outline[0][1]);
  for (const [x, y] of outline.slice(1)) {
    context.lineTo(x, y);
  }
  context.closePath();
  context.save();
  context.fillStyle = stroke.color;
  context.globalAlpha = 1;
  context.fill();

  context.beginPath();
  context.moveTo(outline[0][0], outline[0][1]);
  for (const [x, y] of outline.slice(1)) {
    context.lineTo(x, y);
  }
  context.closePath();
  context.clip();

  const bounds = outline.reduce(
    (current, [x, y]) => ({
      minX: Math.min(current.minX, x),
      maxX: Math.max(current.maxX, x),
      minY: Math.min(current.minY, y),
      maxY: Math.max(current.maxY, y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );
  let seed = Math.floor(stroke.points[0][0] * 17 + stroke.points[0][1] * 31);
  const nextRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  context.globalAlpha = 0.16;
  context.strokeStyle = stroke.color;
  for (let index = 0; index < outline.length * 2; index += 1) {
    const x = bounds.minX + nextRandom() * (bounds.maxX - bounds.minX);
    const y = bounds.minY + nextRandom() * (bounds.maxY - bounds.minY);
    const length = 1 + nextRandom() * 4;
    context.lineWidth = 0.4 + nextRandom() * 1.1;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + length, y + (nextRandom() - 0.5) * 1.5);
    context.stroke();
  }
  context.restore();
}

function hexToRgb(hex: string) {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

function fillArea(canvas: HTMLCanvasElement, fill: DrawingFill) {
  const context = canvas.getContext("2d");
  if (!context) {
    return false;
  }

  const pixelRatio = window.devicePixelRatio || 1;
  const startX = Math.floor(fill.x * pixelRatio);
  const startY = Math.floor(fill.y * pixelRatio);
  if (
    startX < 0 ||
    startY < 0 ||
    startX >= canvas.width ||
    startY >= canvas.height
  ) {
    return false;
  }

  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = image.data;
  const startIndex = (startY * canvas.width + startX) * 4;
  const target = pixels.slice(startIndex, startIndex + 4);
  const replacement = hexToRgb(fill.color);

  if (
    (target[0] === replacement.r &&
      target[1] === replacement.g &&
      target[2] === replacement.b &&
      target[3] === 255)
  ) {
    return false;
  }

  const matchesTarget = (index: number) =>
    pixels[index] === target[0] &&
    pixels[index + 1] === target[1] &&
    pixels[index + 2] === target[2] &&
    pixels[index + 3] === target[3];
  const stack = [[startX, startY]];

  while (stack.length > 0) {
    const point = stack.pop();
    if (!point) {
      continue;
    }

    const [x, y] = point;
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
      continue;
    }
    if (
      x === 0 ||
      y === 0 ||
      x === canvas.width - 1 ||
      y === canvas.height - 1
    ) {
      return false;
    }

    const index = (y * canvas.width + x) * 4;
    if (!matchesTarget(index)) {
      continue;
    }

    pixels[index] = replacement.r;
    pixels[index + 1] = replacement.g;
    pixels[index + 2] = replacement.b;
    pixels[index + 3] = 255;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  context.putImageData(image, 0, 0);
  return true;
}

type DrawingCanvasProps = {
  onSubmit: (imageDataUrl: string) => void;
};

function DrawingCanvas({ onSubmit }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const committedImageRef = useRef<ImageData | null>(null);
  const currentStrokeRef = useRef<Point[]>([]);
  const [actions, setActions] = useState<DrawingAction[]>([]);
  const [redoStack, setRedoStack] = useState<DrawingAction[]>([]);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [tool, setTool] = useState<"brush" | "fill">("brush");
  const [brushSize, setBrushSize] = useState(DEFAULT_SIZE);
  const [isDrawing, setIsDrawing] = useState(false);

  const renderCommittedDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    for (const action of actions) {
      if (action.type === "fill") {
        fillArea(canvas, action);
      } else {
        drawStroke(context, action);
      }
    }
    committedImageRef.current = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    );
  }, [actions]);

  const redrawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    if (committedImageRef.current) {
      context.putImageData(committedImageRef.current, 0, 0);
    } else {
      renderCommittedDrawing();
    }

    if (currentStrokeRef.current.length > 0) {
      drawStroke(context, {
        type: "stroke",
        color,
        size: brushSize,
        points: currentStrokeRef.current,
      });
    }
  }, [brushSize, color, renderCommittedDrawing]);

  const getCanvasPoint = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ): Point => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return [0, 0, 0.5];
    }

    const bounds = canvas.getBoundingClientRect();
    return [
      event.clientX - bounds.left,
      event.clientY - bounds.top,
      0.5,
    ];
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === "fill") {
      const canvas = canvasRef.current;
      const point = getCanvasPoint(event);
      if (!canvas) {
        return;
      }

      const fill = { type: "fill" as const, color, x: point[0], y: point[1] };
      if (committedImageRef.current) {
        canvas.getContext("2d")?.putImageData(committedImageRef.current, 0, 0);
      }

      if (!fillArea(canvas, fill)) {
        return;
      }

      setActions((currentActions) => [...currentActions, fill]);
      setRedoStack([]);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    currentStrokeRef.current = [getCanvasPoint(event)];
    setIsDrawing(true);
    redrawPreview();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }

    currentStrokeRef.current.push(getCanvasPoint(event));
    redrawPreview();
  };

  const finishStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    const finishedStroke = {
      type: "stroke" as const,
      color,
      size: brushSize,
      points: currentStrokeRef.current,
    };
    setActions((currentActions) => [...currentActions, finishedStroke]);
    setRedoStack([]);
    currentStrokeRef.current = [];
    setIsDrawing(false);
  };

  const undo = () => {
    setActions((currentActions) => {
      const lastStroke = currentActions.at(-1);
      if (!lastStroke) {
        return currentActions;
      }
      setRedoStack((currentRedo) => [...currentRedo, lastStroke]);
      return currentActions.slice(0, -1);
    });
  };

  const redo = () => {
    setRedoStack((currentRedo) => {
      const lastStroke = currentRedo.at(-1);
      if (!lastStroke) {
        return currentRedo;
      }
      setActions((currentActions) => [...currentActions, lastStroke]);
      return currentRedo.slice(0, -1);
    });
  };

  const clear = () => {
    setActions([]);
    setRedoStack([]);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey) {
        return;
      }

      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      } else if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actions, redoStack]);

  const submit = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSubmit(canvas.toDataURL("image/png"));
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = bounds.width * pixelRatio;
      canvas.height = bounds.height * pixelRatio;
      canvas.getContext("2d")?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      renderCommittedDrawing();
    };

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    resizeCanvas();
    return () => observer.disconnect();
  }, [renderCommittedDrawing]);

  useEffect(() => {
    renderCommittedDrawing();
  }, [renderCommittedDrawing]);

  return (
    <div className="canvas-shell">
      <canvas
        ref={canvasRef}
        className="canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
      />
      <DrawingToolbar
        color={color}
        onColorChange={setColor}
        tool={tool}
        onToolChange={setTool}
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
        canUndo={actions.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={undo}
        onRedo={redo}
        onClear={clear}
        onSubmit={submit}
      />
    </div>
  );
}

export default DrawingCanvas;
