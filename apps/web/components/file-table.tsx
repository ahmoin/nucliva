"use client";

import {
  ArrowCounterClockwiseIcon,
  CopyIcon,
  DotsThreeIcon,
  FileTextIcon,
  FolderOpenIcon,
  PresentationChartIcon,
  ShareNetworkIcon,
  StarIcon,
  TableIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

const PAGE_SIZES = ["10", "25", "50", "100"];

function pageNumbers(current: number, total: number) {
  const numbers = [
    ...new Set([1, total, current - 1, current, current + 1]),
  ]
    .filter((number) => number >= 1 && number <= total)
    .sort((a, b) => a - b);
  const result: (number | "gap")[] = [];

  for (const number of numbers) {
    const last = result.at(-1);

    if (typeof last === "number" && number - last > 1) {
      result.push("gap");
    }

    result.push(number);
  }

  return result;
}

const kinds = {
  doc: { icon: FileTextIcon, label: "Doc" },
  presentation: { icon: PresentationChartIcon, label: "Presentation" },
  sheet: { icon: TableIcon, label: "Sheet" },
};

export function FileTable({
  items,
  starredOnly = false,
  variant = "default",
}: {
  items: readonly {
    href?: string;
    id: string;
    kind: "doc" | "presentation" | "sheet";
    modified: string;
    name: string;
    owner: string;
    permission?: string;
    starred?: boolean;
  }[];
  starredOnly?: boolean;
  variant?: "default" | "shared" | "trash";
}) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [editingGap, setEditingGap] = useState<number | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const [starOverrides, setStarOverrides] = useState<Record<string, boolean>>(
    {}
  );
  const rows = items.filter((item) => !hidden.includes(item.id));

  const hide = (id: string) => setHidden((current) => [...current, id]);
  const unhide = (id: string) =>
    setHidden((current) => current.filter((value) => value !== id));

  const send = useCallback(
    async (url: string, init: RequestInit, undo?: () => void) => {
      const response = await fetch(url, init).catch(() => null);

      if (response?.ok) {
        router.refresh();
      } else {
        undo?.();
      }
    },
    [router]
  );

  const patch = useCallback(
    (
      id: string,
      body: { starred?: boolean; trashed?: boolean },
      undo?: () => void
    ) =>
      send(
        `/api/documents/${id}`,
        {
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        },
        undo
      ),
    [send]
  );

  const toggleStar = (id: string, next: boolean) => {
    setStarOverrides((current) => ({ ...current, [id]: next }));

    if (starredOnly && !next) {
      hide(id);
    }

    patch(id, { starred: next }, () => {
      setStarOverrides((current) => ({ ...current, [id]: !next }));
      unhide(id);
    });
  };

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, totalPages);
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize);

  const goTo = (next: number) => {
    setPage(Math.min(Math.max(next, 1), totalPages));
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            {/* The name takes what the others leave. In a narrow space, the columns that say least are left out. */}
            <TableHead>Name</TableHead>
            <TableHead className="hidden w-32 @3xl:table-cell">Type</TableHead>
            <TableHead className="hidden w-[18%] @2xl:table-cell">
              {variant === "shared" ? "Shared by" : "Owner"}
            </TableHead>
            {variant === "shared" ? (
              <TableHead className="hidden w-[16%] @2xl:table-cell">
                Access
              </TableHead>
            ) : null}
            <TableHead className="w-28 @2xl:w-[22%]">
              {variant === "trash" ? "Deleted" : "Modified"}
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((item) => {
            const kind = kinds[item.kind];
            const starred = starOverrides[item.id] ?? item.starred ?? false;
            const canOpen = Boolean(item.href) && variant !== "trash";

            return (
              <TableRow
                className={canOpen ? "cursor-pointer" : undefined}
                key={item.id}
                onClick={
                  canOpen
                    ? () => item.href && router.push(item.href)
                    : undefined
                }
              >
                <TableCell className="overflow-hidden">
                  {item.href ? (
                    <Link
                      className="flex min-w-0 items-center gap-3 font-medium hover:underline"
                      href={item.href}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <kind.icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate" title={item.name}>
                        {item.name}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex min-w-0 items-center gap-3 font-medium">
                      <kind.icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden @3xl:table-cell">
                  <Badge variant="secondary">{kind.label}</Badge>
                </TableCell>
                <TableCell
                  className="hidden truncate text-muted-foreground @2xl:table-cell"
                  title={item.owner}
                >
                  {item.owner}
                </TableCell>
                {variant === "shared" ? (
                  <TableCell
                    className="hidden truncate text-muted-foreground @2xl:table-cell"
                    title={item.permission}
                  >
                    {item.permission}
                  </TableCell>
                ) : null}
                <TableCell
                  className="truncate text-muted-foreground"
                  title={item.modified}
                >
                  {item.modified}
                </TableCell>
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          aria-label={`Actions for ${item.name}`}
                          size="icon-sm"
                          variant="ghost"
                        />
                      }
                    >
                      <DotsThreeIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-44">
                      {variant === "trash" ? (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              hide(item.id);
                              patch(item.id, { trashed: false }, () =>
                                unhide(item.id)
                              );
                            }}
                          >
                            <ArrowCounterClockwiseIcon />
                            Restore
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              hide(item.id);
                              send(
                                `/api/documents/${item.id}`,
                                { method: "DELETE" },
                                () => unhide(item.id)
                              );
                            }}
                            variant="destructive"
                          >
                            <TrashIcon />
                            Delete forever
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem
                            disabled={!item.href}
                            onClick={() => item.href && router.push(item.href)}
                          >
                            <FolderOpenIcon />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              send(`/api/documents/${item.id}/copy`, {
                                method: "POST",
                              })
                            }
                          >
                            <CopyIcon />
                            Make a copy
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleStar(item.id, !starred)}
                          >
                            <StarIcon weight={starred ? "fill" : "regular"} />
                            {starred ? "Unstar" : "Star"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!item.href}
                            onClick={() =>
                              navigator.clipboard.writeText(
                                `${window.location.origin}${item.href}`
                              )
                            }
                          >
                            <ShareNetworkIcon />
                            Copy link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              hide(item.id);
                              patch(item.id, { trashed: true }, () =>
                                unhide(item.id)
                              );
                            }}
                            variant="destructive"
                          >
                            <TrashIcon />
                            Move to trash
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {rows.length > Number(PAGE_SIZES[0]) ? (
        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t bg-background py-3">
          <div className="flex items-center gap-4">
            <Field className="w-fit" orientation="horizontal">
              <FieldLabel htmlFor="rows-per-page">Rows per page</FieldLabel>
              <Select
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
                value={String(pageSize)}
              >
                <SelectTrigger className="w-20" id="rows-per-page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    {PAGE_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <span className="hidden text-muted-foreground text-xs md:block">
              {((current - 1) * pageSize + 1).toLocaleString("en-US")}-
              {Math.min(current * pageSize, rows.length).toLocaleString("en-US")}{" "}
              of {rows.length.toLocaleString("en-US")}
            </span>
          </div>
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  aria-disabled={current === 1}
                  className={
                    current === 1 ? "pointer-events-none opacity-50" : undefined
                  }
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    goTo(current - 1);
                  }}
                />
              </PaginationItem>
              {pageNumbers(current, totalPages).map((entry, index) => (
                <PaginationItem key={entry === "gap" ? `gap-${index}` : entry}>
                  {entry === "gap" ? (
                    editingGap === index ? (
                      <Input
                        aria-label="Go to page"
                        autoFocus
                        className="h-9 w-20 text-center"
                        max={totalPages}
                        min={1}
                        onBlur={() => setEditingGap(null)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            const value = Number(event.currentTarget.value);

                            if (Number.isInteger(value) && value > 0) {
                              goTo(value);
                            }

                            setEditingGap(null);
                          }

                          if (event.key === "Escape") {
                            setEditingGap(null);
                          }
                        }}
                        placeholder="Page"
                        type="number"
                      />
                    ) : (
                      <Button
                        aria-label="Jump to a page"
                        onClick={() => setEditingGap(index)}
                        size="icon"
                        variant="ghost"
                      >
                        <DotsThreeIcon />
                      </Button>
                    )
                  ) : (
                    <PaginationLink
                      href="#"
                      isActive={entry === current}
                      onClick={(event) => {
                        event.preventDefault();
                        goTo(entry);
                      }}
                    >
                      {entry}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  aria-disabled={current === totalPages}
                  className={
                    current === totalPages
                      ? "pointer-events-none opacity-50"
                      : undefined
                  }
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    goTo(current + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </>
  );
}
