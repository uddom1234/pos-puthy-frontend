// Type definitions for export libraries

declare module 'xlsx' {
  export interface WorkSheet {
    [key: string]: any;
  }
  
  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [sheetName: string]: WorkSheet };
  }
  
  export const utils: {
    json_to_sheet: (data: any[]) => WorkSheet;
    book_new: () => WorkBook;
    book_append_sheet: (workbook: WorkBook, worksheet: WorkSheet, name: string) => void;
  };
  
  export function writeFile(workbook: WorkBook, filename: string): void;
}

declare module 'jspdf' {
  export class jsPDF {
    constructor(options?: any);
    setFontSize(size: number): void;
    text(text: string, x: number, y: number): void;
    addPage(): void;
    save(filename: string): void;
    internal: {
      pageSize: {
        height: number;
        width: number;
      };
    };
  }
}

declare module 'docx' {
  export class Document {
    constructor(options: {
      sections: Array<{
        properties?: any;
        children: any[];
      }>;
    });
  }
  
  export class Paragraph {
    constructor(options: {
      children?: any[];
      text?: string;
    });
  }
  
  export class TextRun {
    constructor(options: {
      text: string;
      bold?: boolean;
      size?: number;
    });
  }
  
  export class Table {
    constructor(options: {
      rows: TableRow[];
      width?: {
        size: number;
        type: WidthType;
      };
    });
  }
  
  export class TableRow {
    constructor(options: {
      children: TableCell[];
    });
  }
  
  export class TableCell {
    constructor(options: {
      children: any[];
      width?: {
        size: number;
        type: WidthType;
      };
    });
  }
  
  export enum WidthType {
    PERCENTAGE = 'PERCENTAGE',
    DXA = 'DXA'
  }
  
  export class Packer {
    static toBuffer(doc: Document): Promise<Buffer>;
  }
}
