/**
 * Magic number bytes identifying a binary level file.
 *
 * Corresponds to the ASCII string "MSWP" (MineSweeP).
 * Used as the first 4 bytes of every `.mswp` file.
 */
export const MAGIC_NUMBER: readonly number[] = [0x4d, 0x53, 0x57, 0x50];

/**
 * Current binary format version.
 *
 * Stored as the 5th byte of a `.mswp` file.
 * Increment when the binary layout changes in a breaking way.
 */
export const VERSION_BYTE = 0x01;
