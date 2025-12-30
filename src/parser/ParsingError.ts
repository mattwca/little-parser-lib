import { ParsingErrorPosition } from "./types";

/**
 * Represents a parsing error with a specific message.
 */
export class ParsingError extends Error {
  public location: ParsingErrorPosition;

  constructor(message: string, location: ParsingErrorPosition) {
    super(`Parsing Error [${location.line}:${location.column}]: ${message}`);

    this.location = location;
  }
}
