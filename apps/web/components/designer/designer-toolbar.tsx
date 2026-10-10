"use client";

import {
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  ArrowsOutIcon,
  CopyIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  SquareIcon,
  TextTIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { useDesigner } from "@/components/designer/designer";

export function DesignerToolbar() {
  const {
    addLayer,
    canRedo,
    canUndo,
    duplicateSelected,
    redo,
    removeSelected,
    scale,
    selectedIds,
    undo,
    zoomIn,
    zoomOut,
    zoomToFit,
  } = useDesigner();
  const hasSelection = selectedIds.length > 0;

  return (
    <div className="sticky bottom-4 z-10 mx-auto flex w-fit items-center gap-1 border bg-card p-1 shadow-lg">
      <Button
        aria-label="Add text"
        onClick={() => addLayer("text")}
        size="icon-sm"
        variant="ghost"
      >
        <TextTIcon />
      </Button>
      <Button
        aria-label="Add rectangle"
        onClick={() => addLayer("shape")}
        size="icon-sm"
        variant="ghost"
      >
        <SquareIcon />
      </Button>
      <Separator className="mx-1 h-5" orientation="vertical" />
      <Button
        aria-label="Undo"
        disabled={!canUndo}
        onClick={undo}
        size="icon-sm"
        variant="ghost"
      >
        <ArrowCounterClockwiseIcon />
      </Button>
      <Button
        aria-label="Redo"
        disabled={!canRedo}
        onClick={redo}
        size="icon-sm"
        variant="ghost"
      >
        <ArrowClockwiseIcon />
      </Button>
      <Separator className="mx-1 h-5" orientation="vertical" />
      <Button
        aria-label="Duplicate"
        disabled={!hasSelection}
        onClick={duplicateSelected}
        size="icon-sm"
        variant="ghost"
      >
        <CopyIcon />
      </Button>
      <Button
        aria-label="Delete"
        disabled={!hasSelection}
        onClick={removeSelected}
        size="icon-sm"
        variant="ghost"
      >
        <TrashIcon />
      </Button>
      <Separator className="mx-1 h-5" orientation="vertical" />
      <Button
        aria-label="Zoom out"
        onClick={zoomOut}
        size="icon-sm"
        variant="ghost"
      >
        <MagnifyingGlassMinusIcon />
      </Button>
      <span className="w-12 text-center text-muted-foreground text-xs tabular-nums">
        {Math.round(scale * 100)}%
      </span>
      <Button
        aria-label="Zoom in"
        onClick={zoomIn}
        size="icon-sm"
        variant="ghost"
      >
        <MagnifyingGlassPlusIcon />
      </Button>
      <Button
        aria-label="Fit to screen"
        onClick={zoomToFit}
        size="icon-sm"
        variant="ghost"
      >
        <ArrowsOutIcon />
      </Button>
    </div>
  );
}
