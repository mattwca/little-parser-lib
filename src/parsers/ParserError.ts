/**
 * The position of a parsing error, including position in the token stream,
 * source line number and column number.
 */
export type ParserErrorPosition = {
  line: number;
  column: number;
  position: number;
}

/**
 * Represents a parsing error with a specific message.
 */
export class ParserError extends Error {
  constructor(message: string, public location: ParserErrorPosition) {
    super(`Parser Error [${location.line}:${location.column}]: ${message}`);
    this.location = location;
  }
}
