/**
 * Core markdown generation logic for CopyCat
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { CopyCatConfig, MarkdownGenerationResult } from './types';
import {
    normalizePath,
    matchesAnyPattern,
    shouldIgnoreFile,
    getAlwaysIgnoredPatterns,
} from './utils/pathUtils';
import {
    validateFile,
    getLanguageIdentifier,
    collectFilesRecursively,
} from './utils/fileUtils';

/**
 * Generates markdown documentation for an entire workspace based on configuration.
 *
 * @param rootPath - Root URI of the workspace
 * @param config - CopyCat configuration specifying include/ignore patterns
 * @returns Promise that resolves when markdown generation is complete
 */
export async function generateMarkdown(
    rootPath: vscode.Uri,
    config: CopyCatConfig
): Promise<void> {
    const mdPath = vscode.Uri.joinPath(rootPath, 'copycat.md');

    // Validate and normalize configuration
    const normalizedConfig = normalizeConfig(config);

    // Combine user config with always-ignored patterns
    const ignorePatterns = [...normalizedConfig.ignore, ...getAlwaysIgnoredPatterns()];

    // Find files matching include patterns
    const files = await findIncludedFiles(rootPath, normalizedConfig.include, ignorePatterns);

    // Sort files for consistent output
    files.sort((a, b) => a.fsPath.localeCompare(b.fsPath));

    // Generate markdown content
    const output = await generateMarkdownContent(files, mdPath);

    // Write output file
    await vscode.workspace.fs.writeFile(mdPath, Buffer.from(output, 'utf8'));
}

/**
 * Normalizes configuration by providing defaults for empty values.
 *
 * @param config - The configuration to normalize
 * @returns Normalized configuration
 */
function normalizeConfig(config: CopyCatConfig): CopyCatConfig {
    return {
        include: config.include.length === 0 ? ['**/*'] : config.include,
        ignore: config.ignore,
    };
}

/**
 * Finds all files matching include patterns while excluding ignore patterns.
 *
 * @param rootPath - Root URI of the workspace
 * @param includePatterns - Array of glob patterns to include
 * @param ignorePatterns - Array of glob patterns to ignore
 * @returns Promise that resolves to array of matching file URIs
 */
async function findIncludedFiles(
    rootPath: vscode.Uri,
    includePatterns: string[],
    ignorePatterns: string[]
): Promise<vscode.Uri[]> {
    // Construct include glob pattern
    const includeString =
        includePatterns.length > 1 ? `{${includePatterns.join(',')}}` : includePatterns[0];

    // Use RelativePattern to scope search to the specific rootPath
    const includePattern = new vscode.RelativePattern(rootPath, includeString);

    try {
        const allFiles = await vscode.workspace.findFiles(includePattern);

        // Filter files using ignore patterns
        return allFiles.filter((fileUri) => {
            const relativePath = vscode.workspace.asRelativePath(fileUri, false);
            return !matchesAnyPattern(relativePath, ignorePatterns);
        });
    } catch (error) {
        vscode.window.showErrorMessage(`CopyCat: Invalid glob pattern. ${error}`);
        return [];
    }
}

/**
 * Generates markdown content from an array of file URIs.
 *
 * @param files - Array of file URIs to process
 * @param mdPath - Path to the output markdown file (to exclude it)
 * @returns Promise that resolves to the generated markdown string
 */
async function generateMarkdownContent(
    files: vscode.Uri[],
    mdPath: vscode.Uri
): Promise<string> {
    let output = '';

    for (const fileUri of files) {
        // Skip the output markdown file itself
        if (fileUri.fsPath === mdPath.fsPath) {
            continue;
        }

        const fileMarkdown = await formatFileAsMarkdown(fileUri);
        if (fileMarkdown) {
            output += fileMarkdown;
        }
    }

    return output;
}

/**
 * Formats a single file as a markdown code block.
 *
 * @param fileUri - URI of the file to format
 * @returns Promise that resolves to markdown string or null if file should be skipped
 */
async function formatFileAsMarkdown(fileUri: vscode.Uri): Promise<string | null> {
    const relativePath = vscode.workspace.asRelativePath(fileUri, false);

    try {
        // Validate file (size, binary check)
        const validation = await validateFile(fileUri);

        if (!validation.valid) {
            return null; // Skip invalid files silently
        }

        // Format as markdown
        const content = validation.data!.toString();
        const language = getLanguageIdentifier(fileUri.fsPath);

        return `${relativePath}\n\`\`\`${language}\n${content}\n\`\`\`\n\n`;
    } catch (error) {
        console.error(`Error processing file ${relativePath}:`, error);
        return `${relativePath}\n> Error reading file: ${error}\n\n`;
    }
}

/**
 * Generates markdown for a user-selected file or folder.
 *
 * @param selectedUri - URI of the selected file or folder
 * @returns Promise that resolves to the URI of the generated markdown file
 */
export async function generateMarkdownForSelection(
    selectedUri: vscode.Uri
): Promise<vscode.Uri> {
    // Determine if selection is a file or folder
    const stat = await vscode.workspace.fs.stat(selectedUri);
    const isFolder = stat.type === vscode.FileType.Directory;

    // Get configuration
    const config = vscode.workspace.getConfiguration('copycat');
    const saveToRoot = config.get<boolean>('saveSelectionToRoot', false);

    // Determine output path
    const outputPath = determineOutputPath(selectedUri, isFolder, saveToRoot);

    // Collect files to process
    const files = await collectFilesToProcess(selectedUri, isFolder);

    // Generate markdown
    const output = await generateSelectionMarkdown(files, selectedUri);

    // Write output file
    await vscode.workspace.fs.writeFile(outputPath, Buffer.from(output, 'utf8'));

    return outputPath;
}

/**
 * Determines the output path for selection-based markdown generation.
 *
 * @param selectedUri - URI of the selected file or folder
 * @param isFolder - Whether the selection is a folder
 * @param saveToRoot - Whether to save to workspace root
 * @returns URI for the output markdown file
 */
function determineOutputPath(
    selectedUri: vscode.Uri,
    isFolder: boolean,
    saveToRoot: boolean
): vscode.Uri {
    // Generate output filename
    const baseName = path.basename(selectedUri.fsPath);
    const outputFileName = `${baseName}.copycat.md`;

    if (saveToRoot) {
        // Save to workspace root
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(selectedUri);
        if (!workspaceFolder) {
            throw new Error('No workspace folder found. Cannot save to root.');
        }
        return vscode.Uri.joinPath(workspaceFolder.uri, outputFileName);
    }

    // Save next to selection
    if (isFolder) {
        const parentDir = vscode.Uri.file(path.dirname(selectedUri.fsPath));
        return vscode.Uri.joinPath(parentDir, outputFileName);
    }

    const parentDir = path.dirname(selectedUri.fsPath);
    return vscode.Uri.file(path.join(parentDir, outputFileName));
}

/**
 * Collects files to process for selection-based generation.
 *
 * @param selectedUri - URI of the selected file or folder
 * @param isFolder - Whether the selection is a folder
 * @returns Promise that resolves to sorted array of file URIs
 */
async function collectFilesToProcess(
    selectedUri: vscode.Uri,
    isFolder: boolean
): Promise<vscode.Uri[]> {
    const files = isFolder
        ? await collectFilesRecursively(selectedUri)
        : [selectedUri];

    // Sort for consistent output
    files.sort((a, b) => a.fsPath.localeCompare(b.fsPath));

    return files;
}

/**
 * Generates markdown content from selected files.
 *
 * @param files - Array of file URIs to process
 * @param rootUri - Root URI for relative path calculation
 * @returns Promise that resolves to the generated markdown string
 */
async function generateSelectionMarkdown(
    files: vscode.Uri[],
    rootUri: vscode.Uri
): Promise<string> {
    let output = '';

    for (const fileUri of files) {
        const fileMarkdown = await processFileForSelection(fileUri);
        if (fileMarkdown) {
            output += fileMarkdown;
        }
    }

    return output;
}

/**
 * Processes a single file for selection-based markdown generation.
 * Applies always-ignored patterns but not user config patterns.
 *
 * @param fileUri - URI of the file to process
 * @returns Promise that resolves to markdown string or null if file should be skipped
 */
async function processFileForSelection(fileUri: vscode.Uri): Promise<string | null> {
    const relativePath = vscode.workspace.asRelativePath(fileUri, false);

    // Check if should be ignored (using always-ignored patterns only)
    if (shouldIgnoreFile(relativePath)) {
        return null;
    }

    try {
        // Validate file
        const validation = await validateFile(fileUri);

        if (!validation.valid) {
            return null;
        }

        // Format as markdown
        const content = validation.data!.toString();
        const language = getLanguageIdentifier(fileUri.fsPath);

        return `${relativePath}\n\`\`\`${language}\n${content}\n\`\`\`\n\n`;
    } catch (error) {
        console.error(`Error processing file ${relativePath}:`, error);
        return `${relativePath}\n> Error reading file: ${error}\n\n`;
    }
}
