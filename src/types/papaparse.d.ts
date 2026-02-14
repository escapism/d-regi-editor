declare module 'papaparse' {
  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }

  export interface ParseError {
    type: string;
    code: string;
    message: string;
    row?: number;
  }

  export interface ParseMeta {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    fields?: string[];
    truncated: boolean;
    cursor: number;
  }

  export interface ParseConfig<T = any> {
    delimiter?: string;
    newline?: string;
    quoteChar?: string;
    escapeChar?: string;
    header?: boolean;
    transformHeader?: (header: string) => string;
    dynamicTyping?: boolean;
    preview?: number;
    encoding?: string;
    worker?: boolean;
    comments?: boolean | string;
    step?: (results: ParseResult<T>, parser: Parser) => void;
    complete?: (results: ParseResult<T>) => void;
    error?: (error: ParseError, file?: File) => void;
    download?: boolean;
    skipEmptyLines?: boolean | 'greedy';
    chunk?: (results: ParseResult<T>, parser: Parser) => void;
    fastMode?: boolean;
    beforeFirstChunk?: (chunk: string) => string | void;
    withCredentials?: boolean;
    transform?: (value: string, field: string | number) => any;
    delimitersToGuess?: string[];
  }

  export interface Parser {
    abort(): void;
    pause(): void;
    resume(): void;
  }

  export function parse<T = any>(
    input: string | File | Blob,
    config?: ParseConfig<T>
  ): ParseResult<T> | Parser;

  const Papa: {
    parse: typeof parse;
  };

  export { ParseResult, ParseError, ParseMeta, ParseConfig, Parser };
  export default Papa;
}
