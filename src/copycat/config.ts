import * as vscode from 'vscode';

export interface CopyCatConfig {
    include: string[];
    ignore: string[];
}

const DEFAULT_CONFIG = `# CopyCat Config

[INCLUDE]
# Specify folders or files to include
# e.g. src/components/**
# all files in src/components and subfolders will be included

src/**
prisma/schema.prisma
package.json

[IGNORE]
# Specify folders or files to exclude

node_modules/**
.git/**
dist/**
build/**
.env*
**/*.test.ts
**/*.spec.ts
assets/images/**
copycat.md
`;

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
        console.warn('Could not read .copycat file, using defaults or empty.', error);
        return { include: ['**/*'], ignore: ['**/node_modules/**', '.git/**'] }; 
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