import * as vscode from 'vscode';
import { DEFAULT_CONFIG } from './defaults';

export interface CopyCatConfig {
    include: string[];
    ignore: string[];
}

export async function createDefaultConfig(rootPath: vscode.Uri) {
    const configUri = vscode.Uri.joinPath(rootPath, '.copycat');
    try {
        await vscode.workspace.fs.stat(configUri);
        vscode.window.showInformationMessage('.copycat config already exists.');
    } catch {
        await vscode.workspace.fs.writeFile(configUri, Buffer.from(DEFAULT_CONFIG, 'utf8'));
        vscode.window.showInformationMessage('Created .copycat configuration file.');
    }
}

export async function parseConfig(rootPath: vscode.Uri): Promise<CopyCatConfig> {
    const configUri = vscode.Uri.joinPath(rootPath, '.copycat');
    let content = '';

    try {
        const fileData = await vscode.workspace.fs.readFile(configUri);
        content = fileData.toString();
    } catch (error) {
        throw new Error('Configuration file .copycat not found. Run "CopyCat: Initialize" to create it.');
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