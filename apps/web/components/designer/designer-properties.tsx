"use client";

import { Button } from "@workspace/ui/components/button";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { useDesigner } from "@/components/designer/designer";

const numberVar = (value: string | undefined) =>
  String(Math.round(Number.parseFloat(value ?? "0") * 100) / 100);

const geometry = [
  { label: "X", unit: "px", variable: "--x" },
  { label: "Y", unit: "px", variable: "--y" },
  { label: "Width", unit: "px", variable: "--width" },
  { label: "Height", unit: "px", variable: "--height" },
  { label: "Rotation", unit: "deg", variable: "--rotate" },
];

export function DesignerProperties() {
  const { layers, reorderSelected, selectedIds, updateLayer } = useDesigner();
  const layer = layers.find((item) => item.id === selectedIds[0]);

  if (selectedIds.length > 1) {
    return (
      <p className="text-muted-foreground text-sm">
        {selectedIds.length} layers selected. Drag to move them together.
      </p>
    );
  }

  if (!layer) {
    return (
      <p className="text-muted-foreground text-sm">
        Select a layer to edit it, or add text and shapes from the toolbar.
      </p>
    );
  }

  const setVar = (variable: string, value: string) =>
    updateLayer(layer.id, { cssVars: { [variable]: value } });

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="layer-name">Name</FieldLabel>
        <Input
          id="layer-name"
          onChange={(event) => updateLayer(layer.id, { name: event.target.value })}
          value={layer.name}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        {geometry.map(({ label, unit, variable }) => (
          <Field key={variable}>
            <FieldLabel htmlFor={`layer${variable}`}>{label}</FieldLabel>
            <Input
              id={`layer${variable}`}
              onChange={(event) =>
                setVar(variable, `${event.target.value || 0}${unit}`)
              }
              type="number"
              value={numberVar(layer.cssVars[variable])}
            />
          </Field>
        ))}
      </div>
      {layer.type === "text" ? (
        <>
          <Field>
            <FieldLabel htmlFor="layer-text">Text</FieldLabel>
            <Textarea
              id="layer-text"
              onChange={(event) =>
                updateLayer(layer.id, { value: event.target.value })
              }
              rows={3}
              value={layer.value ?? ""}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="layer-size">Size</FieldLabel>
              <Input
                id="layer-size"
                onChange={(event) =>
                  setVar("--font-size", `${event.target.value || 1}px`)
                }
                type="number"
                value={numberVar(layer.cssVars["--font-size"])}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="layer-weight">Weight</FieldLabel>
              <Input
                id="layer-weight"
                max={900}
                min={100}
                onChange={(event) =>
                  setVar("--font-weight", event.target.value || "400")
                }
                step={100}
                type="number"
                value={layer.cssVars["--font-weight"] ?? "400"}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="layer-color">Color</FieldLabel>
            <Input
              id="layer-color"
              onChange={(event) => setVar("--color", event.target.value)}
              type="color"
              value={layer.cssVars["--color"] ?? "#111111"}
            />
          </Field>
        </>
      ) : (
        <Field>
          <FieldLabel htmlFor="layer-fill">Fill</FieldLabel>
          <Input
            id="layer-fill"
            onChange={(event) => setVar("--fill", event.target.value)}
            type="color"
            value={layer.cssVars["--fill"] ?? "#2ee59d"}
          />
        </Field>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => reorderSelected("front")}
          size="sm"
          variant="outline"
        >
          Bring to front
        </Button>
        <Button
          onClick={() => reorderSelected("back")}
          size="sm"
          variant="outline"
        >
          Send to back
        </Button>
      </div>
    </div>
  );
}
