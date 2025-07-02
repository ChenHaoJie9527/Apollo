/**
 * Streaming events
 * 1. chunk: current chunk transferred
 * 2. totalBytes: total bytes transferred
 * 3. transferredBytes: number of bytes transferred
 */
export type StreamingEvent = {
  chunk: Uint8Array;
  totalBytes: number;
  transferredBytes: number;
};