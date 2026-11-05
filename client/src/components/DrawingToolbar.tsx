import Button from "./Button";
import { Brush, PaintBucket, Redo2, Send, Trash2, Undo2 } from "lucide-react";

const COLORS = ["#171717", "#ef476f", "#f4a261", "#2a9d8f", "#457b9d"];
const BRUSH_SIZES = [
  { label: "Small", value: 4 },
  { label: "Medium", value: 8 },
  { label: "Large", value: 16 },
];

type DrawingToolbarProps = {
  color: string;
  onColorChange: (color: string) => void;
  tool: "brush" | "fill";
  onToolChange: (tool: "brush" | "fill") => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSubmit: () => void;
};

function DrawingToolbar({
  color,
  onColorChange,
  tool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onSubmit,
}: DrawingToolbarProps) {
  return (
    <div className="drawing-toolbar">
      <div className="tool-group" aria-label="Drawing modes">
        <button
          className={`tool-toggle ${tool === "brush" ? "tool-toggle--active" : ""}`}
          type="button"
          aria-pressed={tool === "brush"}
          title="Brush tool"
          onClick={() => onToolChange("brush")}
        >
          <Brush size={16} strokeWidth={2} />
          <span>Brush</span>
        </button>
        <button
          className={`tool-toggle ${tool === "fill" ? "tool-toggle--active" : ""}`}
          type="button"
          aria-pressed={tool === "fill"}
          title="Fill tool"
          onClick={() => onToolChange("fill")}
        >
          <PaintBucket size={16} strokeWidth={2} />
          <span>Fill</span>
        </button>
      </div>
      <div className="tool-group" aria-label="Drawing tools">
        <span className="tool-label">Color</span>
        <div className="color-list">
          {COLORS.map((option) => (
            <button
              key={option}
              className={`color-swatch ${color === option ? "color-swatch--active" : ""}`}
              style={{ backgroundColor: option }}
              type="button"
              aria-label={`Use ${option}`}
              aria-pressed={color === option}
              onClick={() => onColorChange(option)}
            />
          ))}
          <label className="custom-color" aria-label="Choose a custom color">
            <input
              type="color"
              value={color}
              onChange={(event) => onColorChange(event.target.value)}
            />
            <span>+</span>
          </label>
        </div>
      </div>
      {tool === "brush" && (
        <div className="tool-group brush-sizes" aria-label="Brush size">
          <span className="tool-label">Size</span>
          {BRUSH_SIZES.map((size) => (
            <button
              key={size.value}
              className={`size-option ${brushSize === size.value ? "size-option--active" : ""}`}
              type="button"
              title={`${size.label} brush`}
              aria-label={`${size.label} brush`}
              aria-pressed={brushSize === size.value}
              onClick={() => onBrushSizeChange(size.value)}
            >
              <span
                className="size-dot"
                style={{ width: size.value, height: size.value }}
              />
            </button>
          ))}
        </div>
      )}

      <div className="toolbar-actions">
        <Button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
        >
          <Undo2 size={16} strokeWidth={2} /> <span>Undo</span>
        </Button>
        <Button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
        >
          <Redo2 size={16} strokeWidth={2} /> <span>Redo</span>
        </Button>
        <Button type="button" onClick={onClear} aria-label="Clear drawing">
          <Trash2 size={16} strokeWidth={2} /> <span>Clear</span>
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={onSubmit}
          aria-label="Submit drawing"
        >
          <Send size={16} strokeWidth={2} /> <span>Submit</span>
        </Button>
      </div>
    </div>
  );
}

export default DrawingToolbar;
