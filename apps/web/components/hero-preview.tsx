"use client";

import {
  FileTextIcon,
  PresentationChartIcon,
  SparkleIcon,
  TableIcon,
} from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { useCallback, useState } from "react";
import { Wordmark } from "@/components/logo";

const previews = {
  doc: {
    icon: FileTextIcon,
    name: "Launch update",
  },
  sheet: {
    icon: TableIcon,
    name: "Competitor sheet",
  },
  slides: {
    icon: PresentationChartIcon,
    name: "Q3 board slides",
  },
};

const order = ["doc", "slides", "sheet"] as const;

const wins = [
  "Onboarding went from ten steps to three.",
  "Median time to first document fell from 14 minutes to 4.",
  "Week-one activation rose from 41% to 63%.",
];

const slides = [
  { note: "Where we landed", title: "Q3 in one slide" },
  { note: "Up from 24% in Q2", title: "Revenue up 32%" },
  { note: "Three wins, one miss", title: "What we learned" },
  { note: "Deliverability and pricing", title: "Next quarter" },
];

const competitors = [
  { name: "Northwind", price: "$24", sources: "3" },
  { name: "Contoso", price: "$19", sources: "2" },
  { name: "Fabrikam", price: "$31", sources: "4" },
];

function DocPreview() {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          <SparkleIcon />
          Voice match 96%
        </Badge>
        <Badge variant="outline">3 sources</Badge>
      </div>
      <h2 className="font-bold text-2xl tracking-tight md:text-4xl">
        We shipped it, and here is what we learned
      </h2>
      <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
        Short version: it worked. Two weeks ago we set out to cut onboarding
        from ten steps to three, and the numbers say we got there. Here is the
        honest breakdown, wins and misses included.
      </p>
      <ul className="flex max-w-2xl list-disc flex-col gap-2 pl-5 text-base marker:text-primary md:text-lg">
        {wins.map((win) => (
          <li key={win}>{win}</li>
        ))}
      </ul>
      <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
        The miss: setup emails still land in spam for about one in eight new
        teams. That is next on the list.
      </p>
    </>
  );
}

function SlidesPreview() {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          <SparkleIcon />
          Voice match 94%
        </Badge>
        <Badge variant="outline">4 slides</Badge>
      </div>
      <h2 className="font-bold text-2xl tracking-tight md:text-4xl">
        Q3 board review
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {slides.map((slide, index) => (
          <Card
            className="aspect-video justify-between"
            key={slide.title}
            size="sm"
          >
            <CardHeader>
              <CardDescription className="tabular-nums">
                0{index + 1}
              </CardDescription>
            </CardHeader>
            <CardHeader>
              <CardTitle className="normal-case tracking-tight">
                {slide.title}
              </CardTitle>
              <CardDescription>{slide.note}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </>
  );
}

function SheetPreview() {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          <SparkleIcon />
          Researched live
        </Badge>
        <Badge variant="outline">9 sources</Badge>
      </div>
      <h2 className="font-bold text-2xl tracking-tight md:text-4xl">
        Competitor pricing
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Starting price</TableHead>
            <TableHead>Sources</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {competitors.map((row) => (
            <TableRow key={row.name}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{row.price}</TableCell>
              <TableCell>{row.sources}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

export function HeroPreview() {
  const [active, setActive] = useState<(typeof order)[number]>("doc");

  const handleSelect = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const { id } = event.currentTarget.dataset;

      if (id === "doc" || id === "slides" || id === "sheet") {
        setActive(id);
      }
    },
    []
  );

  return (
    <div className="select-none border bg-card/50 p-2 shadow-2xl md:p-3">
      <div className="grid border bg-background md:grid-cols-[14rem_1fr]">
        <div className="flex flex-row gap-1 overflow-x-auto border-b p-4 md:flex-col md:border-r md:border-b-0">
          <Wordmark className="mb-3 hidden h-5 md:block" />
          {order.map((id) => {
            const item = previews[id];

            return (
              <Button
                className="justify-start font-normal normal-case tracking-normal data-[active=true]:bg-muted data-[active=true]:font-medium"
                data-active={active === id}
                data-id={id}
                key={id}
                onClick={handleSelect}
                variant="ghost"
              >
                <item.icon />
                {item.name}
              </Button>
            );
          })}
        </div>
        <div
          className="motion-safe:fade-in flex min-h-96 flex-col gap-5 p-6 motion-safe:animate-in motion-safe:duration-200 md:p-10"
          key={active}
        >
          {active === "doc" ? <DocPreview /> : null}
          {active === "slides" ? <SlidesPreview /> : null}
          {active === "sheet" ? <SheetPreview /> : null}
        </div>
      </div>
    </div>
  );
}
