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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { useCallback, useState } from "react";

const PAGE_SIZE = 50;

const kinds = {
  doc: { icon: FileTextIcon, label: "Doc" },
  presentation: { icon: PresentationChartIcon, label: "Presentation" },
  sheet: { icon: TableIcon, label: "Sheet" },
};

export function FileTable({
  items,
  variant = "default",
}: {
  items: readonly {
    id: string;
    kind: "doc" | "presentation" | "sheet";
    modified: string;
    name: string;
    owner: string;
    permission?: string;
  }[];
  variant?: "default" | "shared" | "trash";
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const showMore = useCallback(
    () => setVisible((count) => count + PAGE_SIZE),
    []
  );

  return (
    <>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[38%]">Name</TableHead>
            <TableHead className="w-32">Type</TableHead>
            <TableHead className="w-[18%]">
              {variant === "shared" ? "Shared by" : "Owner"}
            </TableHead>
            {variant === "shared" ? (
              <TableHead className="w-[16%]">Access</TableHead>
            ) : null}
            <TableHead className="w-[22%]">
              {variant === "trash" ? "Deleted" : "Modified"}
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.slice(0, visible).map((item) => {
            const kind = kinds[item.kind];

            return (
              <TableRow key={item.id}>
                <TableCell className="overflow-hidden">
                  <div className="flex min-w-0 items-center gap-3 font-medium">
                    <kind.icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{kind.label}</Badge>
                </TableCell>
                <TableCell
                  className="truncate text-muted-foreground"
                  title={item.owner}
                >
                  {item.owner}
                </TableCell>
                {variant === "shared" ? (
                  <TableCell
                    className="truncate text-muted-foreground"
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
                <TableCell>
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
                          <DropdownMenuItem>
                            <ArrowCounterClockwiseIcon />
                            Restore
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive">
                            <TrashIcon />
                            Delete forever
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem>
                            <FolderOpenIcon />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CopyIcon />
                            Make a copy
                          </DropdownMenuItem>
                          {variant === "default" ? (
                            <>
                              <DropdownMenuItem>
                                <StarIcon />
                                Star
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <ShareNetworkIcon />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive">
                                <TrashIcon />
                                Move to trash
                              </DropdownMenuItem>
                            </>
                          ) : null}
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
      {items.length > PAGE_SIZE ? (
        <div className="flex items-center justify-between gap-4 py-3 text-muted-foreground text-xs">
          <span>
            Showing {Math.min(visible, items.length).toLocaleString("en-US")} of{" "}
            {items.length.toLocaleString("en-US")}
          </span>
          {visible < items.length ? (
            <Button onClick={showMore} size="sm" variant="outline">
              Show more
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
