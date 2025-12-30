import { Token, TokenType } from "./types";

/**
 * Represents a stream of tokens for parsing, including methods to consume and peek tokens,
 * as well as state and method for managing the parsing position.
 */
export class TokenStream {
  public position: number;
  public positionStack: number[];

  constructor (private tokens: Token[]) {
    this.position = 0;
    this.positionStack = [];
  }

  /**
   * Peeks at the next token in the stream, without consuming it.
   * @returns The next token, or null if we're at the end of the stream.
   */
  public peek(): Token | null {
    return this.tokens[this.position] || null;
  }

  /**
   * Consumes and returns the next token in the stream.
   * @returns The consumed token, or null if we're at the end of the stream.
   */
  public consume(): Token | null {
    return this.tokens[this.position++] || null;
  }

  /**
   * Consumes a token if it matches the expected type.
   * @returns The consumed token, or null if the next token does not match the expected type.
   */
  public consumeIf(...types: TokenType[]): Token | null {
    const token = this.peek();
    if (token && types.includes(token.type)) {
      return this.consume();
    }
    return null;
  }

  /**
   * Stores the current position in the position stack.
   */
  public storePosition() {
    this.positionStack.push(this.position);
  }

  /**
   * Clears the last stored position without restoring it.
   */
  public clearPosition() {
    this.positionStack.pop();
  }

  /**
   * Restores the last stored position from the position stack.
   */
  public restorePosition() {
    const pos = this.positionStack.pop();
    if (pos !== undefined) {
      this.position = pos;
    }
  }

  public peekRemainder(): string {
    return this.tokens.slice(this.position).map(t => t.value).join('');
  }

  public getPositionForError(): { line: number; column: number, position: number } {
    const tokenToUse = this.peek() || this.tokens[this.tokens.length - 1];

    return {
      position: this.position,
      ...tokenToUse.position,
    };
  }
}