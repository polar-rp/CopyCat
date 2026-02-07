/**
 * Core type definitions for CopyCat extension
 */

import * as vscode from 'vscode';

/**
 * Configuration interface for CopyCat
 */
export interface CopyCatConfig {
    include: string[];
    ignore: string[];
}

/**
 * Options for generating markdown from a selection
 */
export interface SelectionMarkdownOptions {
    selectedUri: vscode.Uri;
    saveToRoot: boolean;
}

/**
 * Result of markdown generation
 */
export interface MarkdownGenerationResult {
    outputUri: vscode.Uri;
    filesProcessed: number;
    filesSkipped: number;
}
