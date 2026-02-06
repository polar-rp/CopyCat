import * as vscode from 'vscode';
import * as path from 'path';
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
    const ignorePatterns = [...config.ignore, ...ALWAYS_IGNORED];

    // Construct Globs
    const includeString = config.include.length > 1 
        ? `{${config.include.join(',')}}` 
        : config.include[0];
    
    const excludeString = ignorePatterns.length > 1 
        ? `{${ignorePatterns.join(',')}}` 
        : (ignorePatterns[0] || undefined);

    // Use RelativePattern to scope search to the specific rootPath (supports multi-root better)
    const includePattern = new vscode.RelativePattern(rootPath, includeString);

    let files: vscode.Uri[] = [];
    try {
        files = await vscode.workspace.findFiles(includePattern, excludeString);
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
                output += `${relativePath}\n> Skipped: File too large (${(stat.size / 1024).toFixed(1)}KB)\n\n`;
                continue;
            }

            const fileData = await vscode.workspace.fs.readFile(fileUri);
            
            if (isBinary(fileData)) {
                output += `${relativePath}\n> Skipped: Binary file detected\n\n`;
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
