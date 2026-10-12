import Dexie, { type Table } from "dexie";

export interface LocalDocument {
  content: object;
  id: string;
  title: string;
  updatedAt: number;
}

class LocalDatabase extends Dexie {
  documents!: Table<LocalDocument, string>;

  constructor() {
    super("nucliva");
    this.version(1).stores({ documents: "id" });
  }
}

export const localDb = new LocalDatabase();
