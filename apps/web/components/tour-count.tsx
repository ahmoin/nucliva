"use client";

import { useEffect } from "react";
import { type TourState, tour } from "@/components/sandbox-tour-store";

// Tells the tour how many of something a page shows, so a step can wait for
// one more.
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
