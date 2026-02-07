/**
 * Utilities for path manipulation and pattern matching
 */

import { minimatch } from 'minimatch';
import { ALWAYS_IGNORED } from '../defaults';

// Cache for transformed patterns to avoid redundant computation
let transformedPatternsCache: string[] | null = null;

/**
 * Transforms simple folder names in patterns to proper glob patterns.
 * For example: "node_modules" becomes "** /node_modules/** "
 * Patterns with wildcards or paths are left unchanged.
 *
 * @param pattern - The pattern to transform
 * @returns The transformed glob pattern
 */
export function transformPatternToGlob(pattern: string): string {
    // If it's a simple name without glob patterns, convert to ** /name/**
    if (!pattern.includes('/') && !pattern.includes('*') && !pattern.includes('.')) {
        return `**/${pattern}/**`;
    }
    return pattern;
}

/**
 * Gets all always-ignored patterns, transformed to proper glob format.
 * Results are cached for performance.
 *
 * @returns Array of transformed ignore patterns
 */
export function getAlwaysIgnoredPatterns(): string[] {
    if (transformedPatternsCache === null) {
        transformedPatternsCache = ALWAYS_IGNORED.map(transformPatternToGlob);
    }
    return transformedPatternsCache;
}

/**
 * Resets the pattern cache. Useful for testing or when patterns change.
 */
export function resetPatternCache(): void {
    transformedPatternsCache = null;
}

/**
 * Normalizes a file path to use forward slashes (required by minimatch).
 *
 * @param path - The path to normalize
 * @returns Normalized path with forward slashes
 */
export function normalizePath(path: string): string {
    return path.replace(/\\/g, '/');
}

/**
 * Checks if a file path matches any of the provided ignore patterns.
 *
 * @param relativePath - The relative file path to check
 * @param ignorePatterns - Array of glob patterns to match against
 * @returns True if the path should be ignored, false otherwise
 */
export function matchesAnyPattern(relativePath: string, ignorePatterns: string[]): boolean {
    const normalizedPath = normalizePath(relativePath);

    for (const pattern of ignorePatterns) {
        const normalizedPattern = normalizePath(pattern);
        if (minimatch(normalizedPath, normalizedPattern, { dot: true })) {
            return true;
        }
    }

    return false;
}

/**
 * Determines if a file should be ignored based on always-ignored patterns
 * and CopyCat-generated file naming.
 *
 * @param relativePath - The relative file path to check
 * @returns True if the file should be ignored, false otherwise
 */
export function shouldIgnoreFile(relativePath: string): boolean {
    // Skip CopyCat-generated files
    if (relativePath.endsWith('.copycat.md') || relativePath.endsWith('copycat.md')) {
        return true;
    }

    const alwaysIgnoredPatterns = getAlwaysIgnoredPatterns();
    return matchesAnyPattern(relativePath, alwaysIgnoredPatterns);
}
