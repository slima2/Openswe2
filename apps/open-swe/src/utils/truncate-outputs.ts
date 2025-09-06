import { createLogger, LogLevel } from "./logger.js";

const logger = createLogger(LogLevel.INFO, "TruncateOutputs");

export function truncateOutput(
  output: string,
  options?: {
    /**
     * @default Infinity - No truncation by default as requested by user
     */
    numStartCharacters?: number;

    /**
     * @default Infinity - No truncation by default as requested by user
     */
    numEndCharacters?: number;
  },
) {
  const { numStartCharacters = Infinity, numEndCharacters = Infinity } = options ?? {};

  // If either limit is Infinity, return full output without truncation
  if (numStartCharacters === Infinity || numEndCharacters === Infinity) {
    logger.debug(`Output returned without truncation. Length: ${output.length} characters`);
    return output;
  }

  if (numStartCharacters < 0 || numEndCharacters < 0) {
    throw new Error("numStartCharacters and numEndCharacters must be >= 0");
  }
  if (!numStartCharacters && !numEndCharacters) {
    throw new Error(
      "At least one of numStartCharacters or numEndCharacters must be > 0",
    );
  }

  if (output.length <= numStartCharacters + numEndCharacters) {
    return output;
  }

  logger.warn(
    `Truncating output due to its length exceeding the maximum allowed characters. Received ${output.length} characters, but only ${numStartCharacters + numEndCharacters} were allowed.`,
    {
      numAllowedStartCharacters: numStartCharacters,
      numAllowedEndCharacters: numEndCharacters,
      outputLength: output.length,
    },
  );

  return (
    `The following output was truncated due to its length exceeding the maximum allowed characters. Received ${output.length} characters, but only ${numStartCharacters + numEndCharacters} were allowed.\n\n` +
    output.slice(0, numStartCharacters) +
    `\n\n... [content truncated] ...\n\n` +
    output.slice(-numEndCharacters)
  );
}
