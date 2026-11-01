/**
 * WebVTT Subtitle Parser
 * Based on deobfuscated TikTok WebVTT parsing code
 */

import { SubtitleCue } from '../types';

export interface WebVTTParseOptions {
  strict?: boolean;
  includeMeta?: boolean;
}

export interface WebVTTResult {
  valid: boolean;
  strict: boolean;
  cues: SubtitleCue[];
  errors: Error[];
  meta?: Record<string, string>;
}

// Timestamp regex pattern
const TIMESTAMP_PATTERN = /([0-9]{1,2})?:?([0-9]{2}):([0-9]{2}\.[0-9]{2,3})/;

/**
 * Parse WebVTT subtitle content
 */
export function parseWebVTT(vttContent: string, options: WebVTTParseOptions = {}): WebVTTResult {
  if (!vttContent || typeof vttContent !== "string") {
    return { cues: [], valid: false, strict: false, errors: [] };
  }

  const { strict = true, includeMeta = false } = options;

  try {
    // Normalize line endings and split into blocks
    const normalizedContent = vttContent
      .trim()
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");

    const blocks = normalizedContent.split("\n\n");
    const header = blocks.shift();

    // Validate WebVTT header
    if (!header || !header.startsWith("WEBVTT")) {
      throw new Error('Must start with "WEBVTT"');
    }

    const headerLines = header.split("\n");
    const headerComment = headerLines[0].replace("WEBVTT", "");

    // Validate header comment format
    if (headerComment.length > 0 && headerComment[0] !== " " && headerComment[0] !== "\t") {
      throw new Error("Header comment must start with space or tab");
    }

    // Handle empty content
    if (blocks.length === 0 && headerLines.length === 1) {
      return {
        valid: true,
        strict,
        cues: [],
        errors: []
      };
    }

    // Parse cue blocks
    const parseResult = parseCueBlocks(blocks, strict);
    const cues = parseResult.cues;
    const errors = parseResult.errors;

    // Throw first error in strict mode
    if (strict && errors.length > 0) {
      throw errors[0];
    }

    // Parse metadata if requested
    let metadata: Record<string, string> | undefined;
    if (includeMeta) {
      const metaObject: Record<string, string> = {};
      headerLines.slice(1).forEach(line => {
        const colonIndex = line.indexOf(":");
        if (colonIndex > 0) {
          const key = line.slice(0, colonIndex).trim();
          const value = line.slice(colonIndex + 1).trim();
          metaObject[key] = value;
        }
      });
      metadata = Object.keys(metaObject).length > 0 ? metaObject : undefined;
    }

    return {
      valid: errors.length === 0,
      strict,
      cues,
      errors,
      meta: metadata
    };
  } catch (error) {
    return {
      valid: false,
      strict,
      cues: [],
      errors: [error as Error]
    };
  }
}

/**
 * Parse individual cue blocks
 */
function parseCueBlocks(blocks: string[], strict: boolean): { cues: SubtitleCue[]; errors: Error[] } {
  const cues: SubtitleCue[] = [];
  const errors: Error[] = [];

  blocks.forEach((block, index) => {
    try {
      const cue = parseSingleCue(block, index, strict);
      if (cue) {
        cues.push(cue);
      }
    } catch (error) {
      errors.push(error as Error);
    }
  });

  return { cues, errors };
}

/**
 * Parse a single WebVTT cue
 */
function parseSingleCue(cueBlock: string, cueIndex: number, strict: boolean): SubtitleCue | null {
  const lines = cueBlock.split("\n").filter(Boolean);

  // Skip NOTE blocks
  if (lines.length > 0 && lines[0].trim().startsWith("NOTE")) {
    return null;
  }

  // Validate cue structure
  if (lines.length === 1 && !lines[0].includes("-->")) {
    throw new Error(`Cue identifier cannot be standalone (cue #${cueIndex})`);
  }

  if (lines.length > 1 && !(lines[0].includes("-->") || lines[1].includes("-->"))) {
    throw new Error(`Cue identifier needs to be followed by timestamp (cue #${cueIndex})`);
  }

  // Find timestamp line
  const timestampLineIndex = lines.findIndex(line => line.includes("-->"));
  if (timestampLineIndex === -1) {
    throw new Error(`No timestamp found in cue ${cueIndex}`);
  }

  const timestampLine = lines[timestampLineIndex];
  const timestampParts = timestampLine.split(" --> ");

  if (timestampParts.length !== 2 || 
      !isValidTimestamp(timestampParts[0]) || 
      !isValidTimestamp(timestampParts[1])) {
    throw new Error(`Invalid cue timestamp (cue #${cueIndex})`);
  }

  // Parse timestamps
  const startTime = parseTimestamp(timestampParts[0]);
  const endTime = parseTimestamp(timestampParts[1]);

  // Validate timestamp order
  if (strict) {
    if (startTime > endTime) {
      throw new Error(`Start timestamp greater than end (cue #${cueIndex})`);
    }
    if (endTime <= startTime) {
      throw new Error(`End must be greater than start (cue #${cueIndex})`);
    }
  }

  if (!strict && endTime < startTime) {
    throw new Error(`End must be greater or equal to start when not strict (cue #${cueIndex})`);
  }

  // Format start time display
  const startTimeParts = timestampParts[0].split(".")[0].split(":");
  const startTimeDisplay = startTimeParts[0] !== "00" ? 
    timestampParts[0] : 
    `${startTimeParts[1]}:${startTimeParts[2]}`;

  // Extract cue text
  const textLines = lines.slice(timestampLineIndex + 1);
  const text = textLines.join("\n").trim();

  if (!text) {
    return null;
  }

  return {
    start: startTime,
    end: endTime,
    text,
    startStr: startTimeDisplay
  };
}

/**
 * Validate timestamp format
 */
function isValidTimestamp(timestamp: string): boolean {
  return TIMESTAMP_PATTERN.test(timestamp);
}

/**
 * Parse timestamp string to seconds
 */
function parseTimestamp(timestampString: string): number {
  const matches = timestampString.match(TIMESTAMP_PATTERN);
  if (!matches) {
    throw new Error(`Invalid timestamp format: ${timestampString}`);
  }

  const hours = parseFloat(matches[1] || "0") * 60 * 60;
  const minutes = parseFloat(matches[2]) * 60;
  const seconds = parseFloat(matches[3]);
  
  const totalSeconds = hours + minutes + seconds;
  return Number(totalSeconds.toFixed(6));
}

/**
 * Format time in seconds to display string
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get current subtitle cue for given time
 */
export function getCurrentCue(cues: SubtitleCue[], currentTime: number): SubtitleCue | null {
  return cues.find(cue => currentTime >= cue.start && currentTime <= cue.end) || null;
}
