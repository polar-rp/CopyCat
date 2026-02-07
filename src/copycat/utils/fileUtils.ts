/**
 * Utilities for file operations and content detection
 */

import * as path from 'path';
import * as vscode from 'vscode';
import { LANG_MAP, MAX_FILE_SIZE } from '../defaults';

/**
 * Detects if a file buffer contains binary data by checking for null bytes.
 * Checks only the first 1024 bytes for performance.
 *
 * @param buffer - The file buffer to check
 * @returns True if binary data is detected, false otherwise
 */
export function isBinaryFile(buffer: Uint8Array): boolean {
    const checkLength = Math.min(buffer.length, 1024);

    for (let i = 0; i < checkLength; i++) {
        if (buffer[i] === 0) {
            return true;
        }
    }

    return false;
}

/**
 * Determines the language identifier for syntax highlighting based on file extension.
 *
 * @param filePath - The file path to analyze
 * @returns Language identifier (e.g., 'typescript', 'python') or empty string if unknown
 */
export function getLanguageIdentifier(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    return LANG_MAP[ext] ?? '';
}

/**
 * Checks if a file exceeds the maximum allowed size for processing.
 *
 * @param fileUri - The URI of the file to check
 * @returns Promise that resolves to true if file is too large, false otherwise
 */
export async function isFileTooLarge(fileUri: vscode.Uri): Promise<boolean> {
    try {
        const stat = await vscode.workspace.fs.stat(fileUri);
        return stat.size > MAX_FILE_SIZE;
    } catch (error) {
        console.error(`Error checking file size for ${fileUri.fsPath}:`, error);
        return true; // Treat errors as "too large" to skip problematic files
    }
}

/**
 * Validates if a file can be processed (not binary, not too large).
 *
 * @param fileUri - The URI of the file to validate
 * @returns Promise that resolves to an object with validation results
 */
export async function validateFile(fileUri: vscode.Uri): Promise<{
    valid: boolean;
    reason?: 'too-large' | 'binary' | 'error';
    data?: Uint8Array;
}> {
    try {
        // Check size first (cheaper operation)
        if (await isFileTooLarge(fileUri)) {
            return { valid: false, reason: 'too-large' };
        }

        // Read file data
        const fileData = await vscode.workspace.fs.readFile(fileUri);

        // Check if binary
        if (isBinaryFile(fileData)) {
            return { valid: false, reason: 'binary' };
        }

        return { valid: true, data: fileData };
    } catch (error) {
        console.error(`Error validating file ${fileUri.fsPath}:`, error);
        return { valid: false, reason: 'error' };
    }
}

/**
 * Recursively collects all files in a directory.
 *
 * @param dirUri - The directory URI to scan
 * @returns Promise that resolves to array of file URIs
 */
export async function collectFilesRecursively(dirUri: vscode.Uri): Promise<vscode.Uri[]> {
    const files: vscode.Uri[] = [];

    try {
        const entries = await vscode.workspace.fs.readDirectory(dirUri);

        for (const [name, type] of entries) {
            const entryUri = vscode.Uri.joinPath(dirUri, name);

            if (type === vscode.FileType.Directory) {
                const subFiles = await collectFilesRecursively(entryUri);
                files.push(...subFiles);
            } else if (type === vscode.FileType.File) {
                files.push(entryUri);
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${dirUri.fsPath}:`, error);
    }

    return files;
}
