import * as vscode from 'vscode';
import { createDefaultConfig, parseConfig } from './copycat/config';
import { generateMarkdown } from './copycat/generator';

// Map to store debounce timers for each workspace folder
const workspaceTimers = new Map<string, NodeJS.Timeout>();
const DEBOUNCE_DELAY = 1000;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
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

    // Helper to trigger updates for affected folders
    const triggerForUri = (uri: vscode.Uri) => {
        if (uri.fsPath.endsWith('copycat.md')) { return; }
        const folder = vscode.workspace.getWorkspaceFolder(uri);
        if (folder) {
            triggerUpdate(folder);
        }
    };

    const triggerForUris = (uris: readonly vscode.Uri[]) => {
        const affectedFolders = new Set<vscode.WorkspaceFolder>();
        for (const uri of uris) {
            const folder = vscode.workspace.getWorkspaceFolder(uri);
            if (folder) {
                affectedFolders.add(folder);
            }
        }
        affectedFolders.forEach(folder => triggerUpdate(folder));
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

function triggerUpdate(folder: vscode.WorkspaceFolder) {
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

async function runUpdate(folder: vscode.WorkspaceFolder) {
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

export function deactivate() {
    for (const timer of workspaceTimers.values()) {
        clearTimeout(timer);
    }
    workspaceTimers.clear();
    statusBarItem.dispose();
}
