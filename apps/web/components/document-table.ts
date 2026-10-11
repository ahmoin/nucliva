import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  type ElementTransformer,
  TRANSFORMERS,
} from "@lexical/markdown";
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
} from "@lexical/table";
import { $isParagraphNode, $isTextNode, type LexicalNode } from "lexical";

// Markdown for a table: a row of cells between bars, then a row of dashes that
// marks the one above it as the header.
const ROW = /^(?:\|)(.+)(?:\|)\s?$/;
const DIVIDER = /^(\| ?:?-*:? ?)+\|\s?$/;

const $cell = (text: string) => {
  const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);

  // A cell holds blocks of its own, so its text is converted into it.
  $convertFromMarkdownString(text.replaceAll("\\n", "\n"), TRANSFORMERS, cell);

  return cell;
};

const $cells = (line: string): TableCellNode[] | null => {
  const match = line.match(ROW);

  return match?.[1] ? match[1].split("|").map($cell) : null;
};

const columns = (table: TableNode) => {
  const row = table.getFirstChild();

  return $isTableRowNode(row) ? row.getChildrenSize() : 0;
};

export const TABLE: ElementTransformer = {
  dependencies: [TableNode, TableRowNode, TableCellNode],
  export: (node: LexicalNode) => {
    if (!$isTableNode(node)) {
      return null;
    }

    const lines: string[] = [];

    for (const row of node.getChildren()) {
      if (!$isTableRowNode(row)) {
        continue;
      }

      const cells: string[] = [];
      let header = false;

      for (const cell of row.getChildren()) {
        if ($isTableCellNode(cell)) {
          cells.push(
            $convertToMarkdownString(TRANSFORMERS, cell)
              .replaceAll("\n", "\\n")
              .trim()
          );
          header ||= cell.getHeaderStyles() === TableCellHeaderStates.ROW;
        }
      }

      lines.push(`| ${cells.join(" | ")} |`);

      if (header) {
        lines.push(`| ${cells.map(() => "---").join(" | ")} |`);
      }
    }

    return lines.join("\n");
  },
  regExp: ROW,
  // The importer hands over one line at a time, as a paragraph of its own. A
  // row of dashes turns the row above it into the header, and any other row
  // gathers the rows of text before it into a table.
  replace: (parent, _children, match) => {
    if (DIVIDER.test(match[0])) {
      const table = parent.getPreviousSibling();

      if (!$isTableNode(table)) {
        return;
      }

      const last = table.getLastChild();

      if ($isTableRowNode(last)) {
        for (const cell of last.getChildren()) {
          if ($isTableCellNode(cell)) {
            cell.setHeaderStyles(
              TableCellHeaderStates.ROW,
              TableCellHeaderStates.ROW
            );
          }
        }
      }

      parent.remove();

      return;
    }

    const first = $cells(match[0]);

    if (!first) {
      return;
    }

    const rows = [first];
    let widest = first.length;
    let sibling = parent.getPreviousSibling();

    while ($isParagraphNode(sibling) && sibling.getChildrenSize() === 1) {
      const text = sibling.getFirstChild();
      const cells = $isTextNode(text) ? $cells(text.getTextContent()) : null;

      if (!cells) {
        break;
      }

      const before = sibling.getPreviousSibling();

      widest = Math.max(widest, cells.length);
      rows.unshift(cells);
      sibling.remove();
      sibling = before;
    }

    const table = $createTableNode();

    for (const cells of rows) {
      const row = $createTableRowNode();

      table.append(row);

      for (let index = 0; index < widest; index += 1) {
        row.append(cells[index] ?? $cell(""));
      }
    }

    const before = parent.getPreviousSibling();

    // More rows of a table that is already there are added to it.
    if ($isTableNode(before) && columns(before) === widest) {
      before.append(...table.getChildren());
      parent.remove();
    } else {
      parent.replace(table);
    }

    table.selectEnd();
  },
  type: "element",
};

export const DOCUMENT_TRANSFORMERS = [TABLE, ...TRANSFORMERS];
