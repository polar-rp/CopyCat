/**
 * CopyCat VS Code Extension
 * Automatically generates markdown documentation from codebase
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { createDefaultConfig, parseConfig } from './copycat/config';
import { generateMarkdown, generateMarkdownForSelection } from './copycat/generator';

/**
 * Map to store debounce timers for each workspace folder.
 * Key: workspace folder URI as string
 * Value: timeout for pending update
 */
const workspaceTimers = new Map<string, NodeJS.Timeout>();

/**
 * Delay in milliseconds before triggering an update after file changes.
 * This prevents excessive regeneration during rapid file modifications.
 */
const DEBOUNCE_DELAY = 1000;

/**
 * Status bar item for displaying CopyCat status
 */
let statusBarItem: vscode.StatusBarItem;

/**
 * Activates the CopyCat extension.
 * Sets up commands, event listeners, and status bar items.
 *
 * @param context - Extension context provided by VS Code
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('CopyCat is active!');

    // Create Status Bar Item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'copy-cat.initialize';
    context.subscriptions.push(statusBarItem);

    // Command: Initialize
    const initCommand = vscode.commands.registerCommand('copy-cat.initialize', async () => {
        const folder = vscode.workspace.workspaceFolders?.[0];
        if (!folder) {
            vscode.window.showErrorMessage('CopyCat requires an open folder.');
            return;
        }

        await createDefaultConfig(folder.uri);
        triggerUpdate(folder);
    });

    context.subscriptions.push(initCommand);

    // Command: CopyCat Selection
    const copycatSelectionCommand = vscode.commands.registerCommand(
        'copy-cat.copycatSelection',
        async (uri: vscode.Uri) => {
            if (!uri) {
                vscode.window.showErrorMessage('CopyCat: No file or folder selected.');
                return;
            }

            // Warn if selecting existing .copycat.md file
            if (uri.fsPath.endsWith('.copycat.md') || uri.fsPath.endsWith('copycat.md')) {
                const proceed = await vscode.window.showWarningMessage(
                    'You selected a CopyCat-generated markdown file. Generate anyway?',
                    'Yes', 'No'
                );
                if (proceed !== 'Yes') {
                    return;
                }
            }

            try {
                const itemName = path.basename(uri.fsPath);

                const outputUri = await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `CopyCat: Generating markdown for "${itemName}"...`,
                    cancellable: false
                }, async () => {
                    return await generateMarkdownForSelection(uri);
                });

                const openFile = await vscode.window.showInformationMessage(
                    `CopyCat: Generated ${path.basename(outputUri.fsPath)}`,
                    'Open File'
                );

                if (openFile === 'Open File') {
                    const doc = await vscode.workspace.openTextDocument(outputUri);
                    await vscode.window.showTextDocument(doc);
                }
            } catch (error) {
                console.error('CopyCat Selection Error:', error);
                vscode.window.showErrorMessage(
                    `CopyCat: ${error instanceof Error ? error.message : 'Failed to generate markdown.'}`
                );
            }
        }
    );

    context.subscriptions.push(copycatSelectionCommand);

    /**
     * Helper to trigger updates for a single URI.
     * Skips updates if the URI is the generated copycat.md file itself.
     */
    const triggerForUri = (uri: vscode.Uri): void => {
        if (uri.fsPath.endsWith('copycat.md')) {
            return;
        }
        const folder = vscode.workspace.getWorkspaceFolder(uri);
        if (folder) {
            triggerUpdate(folder);
        }
    };

    /**
     * Helper to trigger updates for multiple URIs.
     * Deduplicates workspace folders to avoid redundant updates.
     */
    const triggerForUris = (uris: readonly vscode.Uri[]): void => {
        const affectedFolders = new Set<vscode.WorkspaceFolder>();
        for (const uri of uris) {
            const folder = vscode.workspace.getWorkspaceFolder(uri);
            if (folder) {
                affectedFolders.add(folder);
            }
        }
        affectedFolders.forEach((folder) => triggerUpdate(folder));
    };

    // Event Listeners
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument((doc) => triggerForUri(doc.uri)),
        vscode.workspace.onDidCreateFiles((e) => triggerForUris(e.files)),
        vscode.workspace.onDidDeleteFiles((e) => triggerForUris(e.files)),
        vscode.workspace.onDidRenameFiles((e) => {
            const allUris = [...e.files.map(f => f.oldUri), ...e.files.map(f => f.newUri)];
            triggerForUris(allUris);
        })
    );
}

/**
 * Triggers a debounced update for the specified workspace folder.
 * If an update is already pending, it will be reset and rescheduled.
 *
 * @param folder - The workspace folder to update
 */
function triggerUpdate(folder: vscode.WorkspaceFolder): void {
    const key = folder.uri.toString();
    const existingTimer = workspaceTimers.get(key);
    
    if (existingTimer) {
        clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
        workspaceTimers.delete(key);
        runUpdate(folder);
    }, DEBOUNCE_DELAY);

    workspaceTimers.set(key, timer);
}

/**
 * Executes the markdown generation for the specified workspace folder.
 * Updates the status bar to reflect progress and results.
 *
 * @param folder - The workspace folder to generate markdown for
 */
async function runUpdate(folder: vscode.WorkspaceFolder): Promise<void> {
    statusBarItem.text = '$(sync~spin) CopyCat: Updating...';
    statusBarItem.show();

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Window,
        title: `CopyCat: Updating ${folder.name}...`
    }, async () => {
        try {
            const config = await parseConfig(folder.uri);
            if (!config) {
                statusBarItem.text = '$(circle-slash) CopyCat: No config';
                statusBarItem.tooltip = 'Run "CopyCat: Initialize" to create .copycat file';
                return;
            }
            await generateMarkdown(folder.uri, config);
            statusBarItem.text = '$(check) CopyCat: Ready';
            statusBarItem.tooltip = undefined;
        } catch (error) {
            console.error('CopyCat Error:', error);
            statusBarItem.text = '$(alert) CopyCat: Error';
            if (error instanceof Error) {
                vscode.window.showErrorMessage(`CopyCat: ${error.message}`);
            } else {
                vscode.window.showErrorMessage(`CopyCat: Unknown error occurred.`);
            }
        } finally {
            // Hide status after a delay
            setTimeout(() => {
                if (statusBarItem.text === '$(check) CopyCat: Ready') {
                    statusBarItem.hide();
                }
            }, 3000);
        }
    });
}

/**
 * Deactivates the CopyCat extension.
 * Cleans up timers and disposes of resources.
 */
export function deactivate(): void {
    for (const timer of workspaceTimers.values()) {
        clearTimeout(timer);
    }
    workspaceTimers.clear();
    statusBarItem.dispose();
}
