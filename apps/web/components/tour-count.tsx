"use client";

import { useEffect } from "react";
import { type TourState, tour } from "@/components/sandbox-tour-store";

export function TourCount(props: Partial<Pick<TourState, "runs" | "samples">>) {
  const { runs, samples } = props;

  useEffect(() => {
    tour.set({
      ...(runs === undefined ? {} : { runs }),
      ...(samples === undefined ? {} : { samples }),
    });
  }, [runs, samples]);

  return null;
}
