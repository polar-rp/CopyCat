import * as vscode from 'vscode';
import * as path from 'path';
import { minimatch } from 'minimatch';
import { CopyCatConfig } from './config';
import {LANG_MAP, ALWAYS_IGNORED, MAX_FILE_SIZE} from './defaults';

export async function generateMarkdown(rootPath: vscode.Uri, config: CopyCatConfig): Promise<void> {
    const mdPath = vscode.Uri.joinPath(rootPath, 'copycat.md');

    // Handle empty include
    if (config.include.length === 0) {
        // Fallback or exit? Let's assume user wants to track nothing or everything. 
        // Based on typical behavior, empty might mean "nothing" or "everything".
        // Let's warn and default to everything to be safe, or just return.
        // Given the request, let's default to basic source files if empty, or just '**/*'.
        config.include = ['**/*'];
    }

    // Combine user config with always-ignored patterns
    // Transform simple folder names to glob patterns
    const alwaysIgnoredPatterns = ALWAYS_IGNORED.map(pattern => {
        // If it's a simple name without glob patterns, convert to **/name/**
        if (!pattern.includes('/') && !pattern.includes('*') && !pattern.includes('.')) {
            return `**/${pattern}/**`;
        }
        return pattern;
    });
    const ignorePatterns = [...config.ignore, ...alwaysIgnoredPatterns];

    // Construct Globs
    const includeString = config.include.length > 1 
        ? `{${config.include.join(',')}}` 
        : config.include[0];

    // Use RelativePattern to scope search to the specific rootPath (supports multi-root better)
    const includePattern = new vscode.RelativePattern(rootPath, includeString);

    let files: vscode.Uri[] = [];
    try {
        // Get all files matching include pattern (no exclude pattern here)
        const allFiles = await vscode.workspace.findFiles(includePattern);
        
        // Manually filter files using minimatch for better glob pattern support
        files = allFiles.filter(fileUri => {
            // Get relative path and normalize to forward slashes (minimatch requires this)
            const relativePath = vscode.workspace.asRelativePath(fileUri, false).replace(/\\/g, '/');
            
            // Check if file matches any ignore pattern
            for (const pattern of ignorePatterns) {
                // Normalize pattern to forward slashes too
                const normalizedPattern = pattern.replace(/\\/g, '/');
                
                if (minimatch(relativePath, normalizedPattern, { dot: true })) {
                    return false; // File should be ignored
                }
            }
            
            return true; // File should be included
        });
    } catch (err) {
        vscode.window.showErrorMessage(`CopyCat: Invalid glob pattern. ${err}`);
        return;
    }

    // Sort files
    files.sort((a, b) => a.fsPath.localeCompare(b.fsPath));

    let output = '';

    for (const fileUri of files) {
        // Skip copycat.md itself
        if (fileUri.fsPath === mdPath.fsPath) {
            continue;
        }

        const relativePath = vscode.workspace.asRelativePath(fileUri, false);
        
        try {
            const stat = await vscode.workspace.fs.stat(fileUri);
            if (stat.size > MAX_FILE_SIZE) {
                continue;
            }

            const fileData = await vscode.workspace.fs.readFile(fileUri);
            
            if (isBinary(fileData)) {
                continue;
            }

            const content = fileData.toString();
            const language = getLanguageFromExtension(fileUri.fsPath);

            output += `${relativePath}\n`;
            output += '```' + language + '\n';
            output += content + '\n';
            output += '```\n\n';
        } catch (err) {
            console.error(`Error reading file ${relativePath}:`, err);
            output += `${relativePath}\n`;
            output += `> Error reading file: ${err}\n\n`;
        }
    }

    await vscode.workspace.fs.writeFile(mdPath, Buffer.from(output, 'utf8'));
}

function getLanguageFromExtension(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    return LANG_MAP[ext] ?? '';
}

function isBinary(buffer: Uint8Array): boolean {
    // Check first 1024 bytes for null byte
    const checkLen = Math.min(buffer.length, 1024);
    for (let i = 0; i < checkLen; i++) {
        if (buffer[i] === 0) { // Null byte
            return true;
        }
    }
    return false;
}
