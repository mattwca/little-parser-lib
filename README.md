# @mattwca/little-parser-lib

A lightweight, flexible TypeScript library for building parsers using parser combinators. Create powerful parsers by combining simple, reusable parsing functions.

## Features

- 🚀 **Parser Combinators**: Build complex parsers from simple building blocks
- 🔍 **Built-in Tokenizer**: Flexible tokenization with regex and string matching
- 📝 **TypeScript First**: Full type safety and IntelliSense support
- 🎯 **Backtracking Support**: Automatic position restoration on parse failures
- 📦 **Zero Dependencies**: Lightweight with no external runtime dependencies

## Installation

```bash
npm install @mattwca/little-parser-lib
```

## Quick Start

```typescript
import { Tokenizer, TokenStream, anyOf, and, many, runParser } from '@mattwca/little-parser-lib';

// 1. Define your tokenizer
const tokenizer = new Tokenizer()
  .withTokenType('letter', /[a-zA-Z]/)
  .withTokenType('digit', /[0-9]/)
  .withTokenType('whitespace', /\s/);

// 2. Tokenize your input
const tokens = tokenizer.tokenize('hello123');
const stream = new TokenStream(tokens);

// 3. Create a parser using combinators
const parser = and(
  many(anyOf('letter')),
  many(anyOf('digit'))
);

// 4. Run the parser
const result = runParser(parser, stream);
console.log(result); // { result: [[...letters], [...digits]] }
```

## Core Concepts

### Tokenizer

The `Tokenizer` class converts raw input strings into tokens. Each token has a type, value, and position.

```typescript
const tokenizer = new Tokenizer()
  .withTokenType('number', /[0-9]/)
  .withTokenType('operator', /[+\-*/]/)
  .withTokenType('whitespace', /\s/);

const tokens = tokenizer.tokenize('1 + 2');
// [
//   { type: 'number', value: '1', position: { line: 1, column: 1 } },
//   { type: 'whitespace', value: ' ', position: { line: 1, column: 2 } },
//   { type: 'operator', value: '+', position: { line: 1, column: 3 } },
//   ...
// ]
```

### Parser Functions

A parser function (`ParseFn<T>`) takes a `TokenStream` and returns a `ParserResult<T>`, which can be either:
- `SuccessfulParserResult<T>`: Contains the parsed result
- `FailedParserResult`: Contains error message and position

## Parser Combinators

### `and(...parsers)`

Combines multiple parsers in sequence. All parsers must succeed.

```typescript
const parser = and(
  anyOf('keyword'),
  anyOf('identifier'),
  anyOf('semicolon')
);
```

### `or(...parsers)`

Tries parsers in order, returns the first successful result. If all fail, returns the deepest error.

```typescript
const parser = or(
  anyOf('keyword'),
  anyOf('identifier'),
  anyOf('operator')
);
```

### `many(parser)`

Applies a parser repeatedly until it fails (requires at least one success).

```typescript
const parser = many(anyOf('digit')); // Parses one or more digits
```

### `optional(parser, shouldBacktrack?)`

Makes a parser optional. Returns `null` if it fails.

```typescript
const parser = optional(anyOf('sign')); // Sign is optional
```

### `attempt(parser)`

Wraps a parser with automatic backtracking on failure.

```typescript
const parser = attempt(
  and(anyOf('keyword'), anyOf('identifier'))
);
```

### `map(parser, mapFn)`

Transforms the result of a parser using a mapping function.

```typescript
const digitParser = anyOf('digit');
const numberParser = map(
  many(digitParser),
  (tokens) => parseInt(tokens.map(t => t.value).join(''))
);
```

### `label(label, parser)`

Adds a custom label to parser errors for better debugging.

```typescript
const parser = label(
  'function declaration',
  and(anyOf('function'), anyOf('identifier'))
);
```

## Built-in Parsers

### `anyOf(...types)`

Parses any token matching the specified type(s).

```typescript
const parser = anyOf('letter', 'digit', 'underscore');
```

### `anyExcept(...types)`

Parses any token NOT matching the specified type(s).

```typescript
const parser = anyExcept('whitespace', 'newline');
```

### `endOfInput()`

Ensures the end of input has been reached.

```typescript
const parser = and(
  myMainParser,
  endOfInput() // Ensure nothing left to parse
);
```

## Running Parsers

### `runParser(parser, tokenStream)`

Runs a parser on a token stream. Throws `ParsingError` on failure.

```typescript
try {
  const result = runParser(myParser, tokenStream);
  console.log(result.result);
} catch (error) {
  if (error instanceof ParsingError) {
    console.error(`Parse error at ${error.position.line}:${error.position.column}`);
  }
}
```

### `runParserOnString(parser, input, tokenizer)`

Convenience method to tokenize and parse in one step.

```typescript
const result = runParserOnString(myParser, 'input string', tokenizer);
```

## Example: Simple Expression Parser

```typescript
import { 
  Tokenizer, 
  TokenStream, 
  anyOf, 
  and, 
  or, 
  many, 
  map, 
  runParserOnString 
} from '@mattwca/little-parser-lib';

// Define tokenizer
const tokenizer = new Tokenizer()
  .withTokenType('digit', /[0-9]/)
  .withTokenType('plus', '+')
  .withTokenType('minus', '-')
  .withTokenType('whitespace', /\s/);

// Define parsers
const digit = anyOf('digit');
const number = map(
  many(digit),
  (tokens) => parseInt(tokens.map(t => t.value).join(''))
);

const operator = or(
  anyOf('plus'),
  anyOf('minus')
);

const expression = and(
  number,
  optional(anyOf('whitespace')),
  operator,
  optional(anyOf('whitespace')),
  number
);

// Parse
const result = runParserOnString(expression, '10 + 5', tokenizer);
console.log(result.result); // [10, null, {...}, null, 5]
```

## Error Handling

The library provides detailed error messages with position information:

```typescript
try {
  const result = runParser(myParser, stream);
} catch (error) {
  if (error instanceof ParsingError) {
    console.error(`
      Error: ${error.message}
      Line: ${error.position.line}
      Column: ${error.position.column}
      Position: ${error.position.position}
    `);
  }
}
```

## API Reference

### Classes

- `Tokenizer`: Converts input strings into tokens
- `TokenStream`: Manages token consumption and backtracking
- `ParsingError`: Error thrown when parsing fails

### Types

- `Token`: Represents a single token with type, value, and position
- `TokenType`: String identifier for token types
- `ParseFn<T>`: Function that takes a TokenStream and returns ParserResult<T>
- `ParserResult<T>`: Union of SuccessfulParserResult<T> and FailedParserResult

### Combinators

- `and(...parsers)`: Sequential combination
- `or(...parsers)`: Alternative combination
- `many(parser)`: One or more repetitions
- `optional(parser)`: Optional parser
- `attempt(parser)`: Parser with backtracking
- `map(parser, fn)`: Transform parser result
- `label(label, parser)`: Add error label

### Parsers

- `anyOf(...types)`: Match any of specified token types
- `anyExcept(...types)`: Match any token except specified types
- `endOfInput()`: Match end of input

### Utilities

- `runParser(parser, stream)`: Execute parser on token stream
- `runParserOnString(parser, input, tokenizer)`: Execute parser on string
- `isSuccessfulResult(result)`: Type guard for successful results
- `isFailedResult(result)`: Type guard for failed results

## License

MIT

## Author

@mattwca
