/**
 * Configuration management for CopyCat
 */

import * as vscode from 'vscode';
import { DEFAULT_CONFIG } from './defaults';
import { CopyCatConfig } from './types';

/**
 * Creates a default .copycat configuration file in the specified workspace root.
 * If the file already exists, shows an info message instead.
 *
 * @param rootPath - Root URI of the workspace
 * @returns Promise that resolves when the config is created or verified
 */
export async function createDefaultConfig(rootPath: vscode.Uri): Promise<void> {
    const configUri = vscode.Uri.joinPath(rootPath, '.copycat');
    try {
        await vscode.workspace.fs.stat(configUri);
        vscode.window.showInformationMessage('.copycat config already exists.');
    } catch {
        await vscode.workspace.fs.writeFile(configUri, Buffer.from(DEFAULT_CONFIG, 'utf8'));
        vscode.window.showInformationMessage('Created .copycat configuration file.');
    }
}

/**
 * Parses the .copycat configuration file from the specified workspace root.
 * The config file uses a simple INI-like format with [INCLUDE] and [IGNORE] sections.
 *
 * @param rootPath - Root URI of the workspace
 * @returns Promise that resolves to parsed configuration or null if config doesn't exist
 */
export async function parseConfig(rootPath: vscode.Uri): Promise<CopyCatConfig | null> {
    const configUri = vscode.Uri.joinPath(rootPath, '.copycat');
    let content = '';

    try {
        const fileData = await vscode.workspace.fs.readFile(configUri);
        content = fileData.toString();
    } catch (error) {
        return null;
    }

    const config: CopyCatConfig = {
        include: [],
        ignore: []
    };

    let currentSection: 'INCLUDE' | 'IGNORE' | null = null;

    const lines = content.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }

        if (trimmed === '[INCLUDE]') {
            currentSection = 'INCLUDE';
            continue;
        }

        if (trimmed === '[IGNORE]') {
            currentSection = 'IGNORE';
            continue;
        }

        if (currentSection === 'INCLUDE') {
            config.include.push(trimmed);
        } else if (currentSection === 'IGNORE') {
            config.ignore.push(trimmed);
        }
    }

    return config;
}