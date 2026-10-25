"use client";

import Moveable from "react-moveable";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { isTyping } from "@/components/hotkeys";

export interface DesignerLayer {
  cssVars: Record<string, string>;
  id: string;
  name: string;
  type: "shape" | "text";
  value?: string;
}

export interface DesignerFrameSize {
  height: number;
  width: number;
}

const GEOMETRY_VARS = ["--x", "--y", "--width", "--height", "--rotate"];
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

const layerDefaults = {
  shape: {
    "--fill": "#2ee59d",
    "--height": "160px",
    "--radius": "0px",
    "--rotate": "0deg",
    "--width": "240px",
    "--x": "0px",
    "--y": "0px",
  },
  text: {
    "--color": "#111111",
    "--font-size": "32px",
    "--font-weight": "400",
    "--height": "64px",
    "--rotate": "0deg",
    "--text-align": "left",
    "--width": "480px",
    "--x": "0px",
    "--y": "0px",
  },
};

export function createLayer(
  type: DesignerLayer["type"],
  frame: DesignerFrameSize,
  overrides: Partial<Omit<DesignerLayer, "id" | "type">> = {}
): DesignerLayer {
  const base = layerDefaults[type];
  const width = Number.parseFloat(overrides.cssVars?.["--width"] ?? base["--width"]);
  const height = Number.parseFloat(
    overrides.cssVars?.["--height"] ?? base["--height"]
  );

  return {
    id: crypto.randomUUID(),
    name: type === "text" ? "Text" : "Rectangle",
    type,
    value: type === "text" ? "Type something" : undefined,
    ...overrides,
    cssVars: {
      ...base,
      "--x": `${Math.round((frame.width - width) / 2)}px`,
      "--y": `${Math.round((frame.height - height) / 2)}px`,
      ...overrides.cssVars,
    },
  };
}

interface DesignerContextValue {
  addLayer: (type: DesignerLayer["type"]) => void;
  canRedo: boolean;
  canUndo: boolean;
  commit: (layers: DesignerLayer[]) => void;
  duplicateSelected: () => void;
  editingId: string | null;
  frameSize: DesignerFrameSize;
  layers: DesignerLayer[];
  redo: () => void;
  removeSelected: () => void;
  reorderSelected: (direction: "back" | "front") => void;
  scale: number;
  selectedIds: string[];
  setEditingId: (id: string | null) => void;
  setFit: (fit: number) => void;
  setSelectedIds: (ids: string[]) => void;
  undo: () => void;
  updateLayer: (
    id: string,
    patch: Partial<Omit<DesignerLayer, "cssVars" | "id">> & {
      cssVars?: Record<string, string>;
    }
  ) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
}

const DesignerContext = createContext<DesignerContextValue | null>(null);

export function useDesigner() {
  const context = useContext(DesignerContext);

  if (!context) {
    throw new Error("useDesigner must be used inside <Designer>");
  }

  return context;
}

export function Designer({
  children,
  defaultLayers = [],
  frameSize = { height: 540, width: 960 },
  layers: controlledLayers,
  onLayersChange,
}: {
  children: React.ReactNode;
  defaultLayers?: DesignerLayer[];
  frameSize?: DesignerFrameSize;
  layers?: DesignerLayer[];
  onLayersChange?: (layers: DesignerLayer[]) => void;
}) {
  const [internalLayers, setInternalLayers] = useState(defaultLayers);
  const layers = controlledLayers ?? internalLayers;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const [fit, setFit] = useState(1);
  const [history, setHistory] = useState({ future: 0, past: 0 });
  const past = useRef<DesignerLayer[][]>([]);
  const future = useRef<DesignerLayer[][]>([]);
  const scale = zoom ?? fit;

  const syncHistory = useCallback(
    () =>
      setHistory({ future: future.current.length, past: past.current.length }),
    []
  );

  const apply = useCallback(
    (next: DesignerLayer[]) => {
      setInternalLayers(next);
      onLayersChange?.(next);
    },
    [onLayersChange]
  );

  const commit = useCallback(
    (next: DesignerLayer[]) => {
      past.current.push(layers);
      future.current = [];
      apply(next);
      syncHistory();
    },
    [apply, layers, syncHistory]
  );

  const undo = useCallback(() => {
    const previous = past.current.pop();

    if (!previous) {
      return;
    }

    future.current.push(layers);
    apply(previous);
    syncHistory();
  }, [apply, layers, syncHistory]);

  const redo = useCallback(() => {
    const next = future.current.pop();

    if (!next) {
      return;
    }

    past.current.push(layers);
    apply(next);
    syncHistory();
  }, [apply, layers, syncHistory]);

  const updateLayer = useCallback<DesignerContextValue["updateLayer"]>(
    (id, patch) =>
      commit(
        layers.map((layer) =>
          layer.id === id
            ? {
                ...layer,
                ...patch,
                cssVars: { ...layer.cssVars, ...patch.cssVars },
              }
            : layer
        )
      ),
    [commit, layers]
  );

  const addLayer = useCallback(
    (type: DesignerLayer["type"]) => {
      const layer = createLayer(type, frameSize);

      commit([...layers, layer]);
      setSelectedIds([layer.id]);
    },
    [commit, frameSize, layers]
  );

  const removeSelected = useCallback(() => {
    if (selectedIds.length === 0) {
      return;
    }

    commit(layers.filter((layer) => !selectedIds.includes(layer.id)));
    setSelectedIds([]);
  }, [commit, layers, selectedIds]);

  const duplicateSelected = useCallback(() => {
    const copies = layers
      .filter((layer) => selectedIds.includes(layer.id))
      .map((layer) => ({
        ...layer,
        cssVars: {
          ...layer.cssVars,
          "--x": `${Number.parseFloat(layer.cssVars["--x"] ?? "0") + 24}px`,
          "--y": `${Number.parseFloat(layer.cssVars["--y"] ?? "0") + 24}px`,
        },
        id: crypto.randomUUID(),
        name: `${layer.name} copy`,
      }));

    if (copies.length === 0) {
      return;
    }

    commit([...layers, ...copies]);
    setSelectedIds(copies.map((copy) => copy.id));
  }, [commit, layers, selectedIds]);

  const reorderSelected = useCallback(
    (direction: "back" | "front") => {
      const chosen = layers.filter((layer) => selectedIds.includes(layer.id));
      const rest = layers.filter((layer) => !selectedIds.includes(layer.id));

      commit(direction === "front" ? [...rest, ...chosen] : [...chosen, ...rest]);
    },
    [commit, layers, selectedIds]
  );

  const zoomIn = useCallback(
    () => setZoom(Math.min(ZOOM_MAX, scale + ZOOM_STEP)),
    [scale]
  );
  const zoomOut = useCallback(
    () => setZoom(Math.max(ZOOM_MIN, scale - ZOOM_STEP)),
    [scale]
  );
  const zoomToFit = useCallback(() => setZoom(null), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target) || editingId) {
        return;
      }

      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (mod && key === "z") {
        event.preventDefault();
        (event.shiftKey ? redo : undo)();
      } else if (mod && key === "d") {
        event.preventDefault();
        duplicateSelected();
      } else if (mod && key === "a") {
        event.preventDefault();
        setSelectedIds(layers.map((layer) => layer.id));
      } else if (key === "delete" || key === "backspace") {
        event.preventDefault();
        removeSelected();
      } else if (key === "escape") {
        setSelectedIds([]);
      } else if (key.startsWith("arrow") && selectedIds.length > 0) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        const dx = { arrowleft: -step, arrowright: step }[key] ?? 0;
        const dy = { arrowdown: step, arrowup: -step }[key] ?? 0;

        commit(
          layers.map((layer) =>
            selectedIds.includes(layer.id)
              ? {
                  ...layer,
                  cssVars: {
                    ...layer.cssVars,
                    "--x": `${Number.parseFloat(layer.cssVars["--x"] ?? "0") + dx}px`,
                    "--y": `${Number.parseFloat(layer.cssVars["--y"] ?? "0") + dy}px`,
                  },
                }
              : layer
          )
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    commit,
    duplicateSelected,
    editingId,
    layers,
    redo,
    removeSelected,
    selectedIds,
    undo,
  ]);

  const value = useMemo<DesignerContextValue>(
    () => ({
      addLayer,
      canRedo: history.future > 0,
      canUndo: history.past > 0,
      commit,
      duplicateSelected,
      editingId,
      frameSize,
      layers,
      redo,
      removeSelected,
      reorderSelected,
      scale,
      selectedIds,
      setEditingId,
      setFit,
      setSelectedIds,
      undo,
      updateLayer,
      zoomIn,
      zoomOut,
      zoomToFit,
    }),
    [
      addLayer,
      commit,
      duplicateSelected,
      editingId,
      frameSize,
      history,
      layers,
      redo,
      removeSelected,
      reorderSelected,
      scale,
      selectedIds,
      undo,
      updateLayer,
      zoomIn,
      zoomOut,
      zoomToFit,
    ]
  );

  return (
    <DesignerContext.Provider value={value}>
      {children}
    </DesignerContext.Provider>
  );
}

const geometryOf = (get: (name: string) => string | undefined) => ({
  height: get("--height") || "0px",
  transform: `translate(${get("--x") || "0px"}, ${get("--y") || "0px"}) rotate(${get("--rotate") || "0deg"})`,
  width: get("--width") || "0px",
});

const styleFor = (layer: DesignerLayer): React.CSSProperties => ({
  ...(layer.cssVars as React.CSSProperties),
  ...geometryOf((name) => layer.cssVars[name]),
  left: 0,
  position: "absolute",
  top: 0,
  ...(layer.type === "text"
    ? {
        color: "var(--color)",
        fontSize: "var(--font-size)",
        fontWeight: "var(--font-weight)" as never,
        lineHeight: 1.2,
        overflow: "hidden",
        textAlign: "var(--text-align)" as never,
        whiteSpace: "pre-wrap",
      }
    : { background: "var(--fill)", borderRadius: "var(--radius)" }),
});

export function DesignerStaticFrame({
  frameSize,
  layers,
  width,
}: {
  frameSize: DesignerFrameSize;
  layers: DesignerLayer[];
  width: number;
}) {
  const scale = width / frameSize.width;

  return (
    <div
      className="relative overflow-hidden bg-white"
      style={{ height: frameSize.height * scale, width }}
    >
      <div
        className="pointer-events-none absolute top-0 left-0 origin-top-left"
        style={{
          height: frameSize.height,
          transform: `scale(${scale})`,
          width: frameSize.width,
        }}
      >
        {layers.map((layer) => (
          <div key={layer.id} style={styleFor(layer)}>
            {layer.type === "text" ? layer.value : null}
          </div>
        ))}
      </div>
    </div>
  );
}

const frameOf = (el: HTMLElement | SVGElement) => {
  const read = (name: string) =>
    Number.parseFloat(el.style.getPropertyValue(name)) || 0;

  return { rotate: read("--rotate"), x: read("--x"), y: read("--y") };
};

const writeVars = (el: HTMLElement | SVGElement, vars: Record<string, string>) => {
  for (const [name, value] of Object.entries(vars)) {
    el.style.setProperty(name, value);
  }

  const { height, transform, width } = geometryOf((name) =>
    el.style.getPropertyValue(name)
  );

  el.style.height = height;
  el.style.transform = transform;
  el.style.width = width;
};

export function DesignerFrame() {
  const {
    commit,
    editingId,
    frameSize,
    layers,
    scale,
    selectedIds,
    setEditingId,
    setFit,
    setSelectedIds,
    updateLayer,
  } = useDesigner();
  const canvasRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const moveableRef = useRef<Moveable>(null);
  const [targets, setTargets] = useState<HTMLElement[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current as HTMLDivElement | null;

    if (!canvas) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? frameSize.width;

      setFit(Math.min(width / frameSize.width, 2));
    });

    observer.observe(canvas);

    return () => observer.disconnect();
  }, [frameSize.width, setFit]);

  useLayoutEffect(() => {
    const frame = frameRef.current as HTMLDivElement | null;

    setTargets(
      editingId || !frame
        ? []
        : selectedIds.flatMap((id) => {
            const el = frame.querySelector<HTMLElement>(
              `[data-layer-id="${id}"]`
            );

            return el ? [el] : [];
          })
    );
  }, [editingId, layers, selectedIds]);

  useEffect(() => {
    moveableRef.current?.updateRect();
  }, [layers, scale]);

  const others = useMemo(() => {
    const frame = frameRef.current as HTMLDivElement | null;

    if (!frame) {
      return [];
    }

    return layers
      .filter((layer) => !selectedIds.includes(layer.id))
      .flatMap((layer) => {
        const el = frame.querySelector<HTMLElement>(
          `[data-layer-id="${layer.id}"]`
        );

        return el ? [el] : [];
      });
  }, [layers, selectedIds]);

  const commitFromDom = () => {
    commit(
      layers.map((layer) => {
        const el = targets.find((target) => target.dataset.layerId === layer.id);

        if (!el) {
          return layer;
        }

        const cssVars = { ...layer.cssVars };

        for (const name of GEOMETRY_VARS) {
          const raw = el.style.getPropertyValue(name);
          const unit = name === "--rotate" ? "deg" : "px";

          if (raw) {
            cssVars[name] = `${Math.round(Number.parseFloat(raw) * 100) / 100}${unit}`;
          }
        }

        return { ...layer, cssVars };
      })
    );
  };

  return (
    <div className="overflow-auto" ref={canvasRef}>
      <div
        className="mx-auto"
        style={{
          height: frameSize.height * scale,
          width: frameSize.width * scale,
        }}
      >
        <div
          className="relative origin-top-left bg-white shadow-lg ring-1 ring-foreground/10"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedIds([]);
            }
          }}
          ref={frameRef}
          role="presentation"
          style={{
            height: frameSize.height,
            transform: `scale(${scale})`,
            width: frameSize.width,
          }}
        >
          {layers.map((layer) => (
            <div
              className="select-none outline-none"
              contentEditable={editingId === layer.id}
              data-layer-id={layer.id}
              key={layer.id}
              onBlur={(event) => {
                if (editingId === layer.id) {
                  updateLayer(layer.id, { value: event.currentTarget.innerText });
                  setEditingId(null);
                }
              }}
              onDoubleClick={() => layer.type === "text" && setEditingId(layer.id)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.currentTarget.blur();
                }
              }}
              onPointerDown={(event) => {
                event.stopPropagation();

                if (editingId === layer.id) {
                  return;
                }

                setSelectedIds(
                  event.shiftKey
                    ? [...new Set([...selectedIds, layer.id])]
                    : [layer.id]
                );
              }}
              ref={(el) => {
                if (el && editingId === layer.id) {
                  el.focus();
                }
              }}
              style={styleFor(layer)}
              suppressContentEditableWarning
            >
              {layer.type === "text" ? layer.value : null}
            </div>
          ))}
          <Moveable
            draggable
            elementGuidelines={others}
            horizontalGuidelines={[0, frameSize.height / 2, frameSize.height]}
            keepRatio={false}
            onDrag={(event) =>
              writeVars(event.target, {
                "--x": `${event.beforeTranslate[0]}px`,
                "--y": `${event.beforeTranslate[1]}px`,
              })
            }
            onDragEnd={commitFromDom}
            onDragGroup={({ events }) => {
              for (const event of events) {
                writeVars(event.target, {
                  "--x": `${event.beforeTranslate[0]}px`,
                  "--y": `${event.beforeTranslate[1]}px`,
                });
              }
            }}
            onDragGroupEnd={commitFromDom}
            onDragGroupStart={({ events }) => {
              for (const event of events) {
                const frame = frameOf(event.target);

                event.set([frame.x, frame.y]);
              }
            }}
            onDragStart={(event) => {
              const frame = frameOf(event.target);

              event.set([frame.x, frame.y]);
            }}
            onResize={(event) =>
              writeVars(event.target, {
                "--height": `${event.height}px`,
                "--width": `${event.width}px`,
                "--x": `${event.drag.beforeTranslate[0]}px`,
                "--y": `${event.drag.beforeTranslate[1]}px`,
              })
            }
            onResizeEnd={commitFromDom}
            onResizeStart={(event) => {
              const frame = frameOf(event.target);

              event.setOrigin(["%", "%"]);
              if (event.dragStart) {
                event.dragStart.set([frame.x, frame.y]);
              }
            }}
            onRotate={(event) =>
              writeVars(event.target, { "--rotate": `${event.beforeRotate}deg` })
            }
            onRotateEnd={commitFromDom}
            onRotateStart={(event) => {
              event.set(frameOf(event.target).rotate);
            }}
            origin={false}
            ref={moveableRef}
            resizable={targets.length === 1}
            rotatable={targets.length === 1}
            snappable
            snapThreshold={6}
            target={targets}
            verticalGuidelines={[0, frameSize.width / 2, frameSize.width]}
            zoom={1 / scale}
          />
        </div>
      </div>
    </div>
  );
}
