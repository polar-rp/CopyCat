# 🛠️ CopyCat Developer Guide

## 📐 Architektura projektu

### Struktura katalogów

```
src/
├── extension.ts                    # Entry point, aktywacja rozszerzenia
└── copycat/
    ├── types.ts                    # Definicje typów TypeScript
    ├── config.ts                   # Zarządzanie konfiguracją .copycat
    ├── defaults.ts                 # Stałe, mapy języków, domyślne wzorce
    ├── generator.ts                # Główna logika generowania markdown
    └── utils/
        ├── fileUtils.ts            # Operacje na plikach
        └── pathUtils.ts            # Operacje na ścieżkach i wzorcach
```

### Flow danych

```
User Action
    ↓
extension.ts (Command Handler)
    ↓
config.ts (Parse Configuration)
    ↓
generator.ts (Orchestration)
    ↓
utils/* (File/Path Operations)
    ↓
Output: copycat.md
```

## 🔧 Komponenty systemu

### 1. Extension Activation (`extension.ts`)

**Odpowiedzialność:**
- Rejestracja komend VS Code
- Obsługa zdarzeń workspace (save, create, delete, rename)
- Debouncing aktualizacji
- Status bar management

**Kluczowe funkcje:**
```typescript
activate(context: vscode.ExtensionContext): void
triggerUpdate(folder: vscode.WorkspaceFolder): void
runUpdate(folder: vscode.WorkspaceFolder): Promise<void>
```

### 2. Configuration (`config.ts`)

**Odpowiedzialność:**
- Tworzenie domyślnej konfiguracji
- Parsowanie pliku `.copycat`
- Walidacja sekcji [INCLUDE] i [IGNORE]

**Format konfiguracji:**
```
[INCLUDE]
src/**
package.json

[IGNORE]
**/*.test.ts
.env*
```

**API:**
```typescript
createDefaultConfig(rootPath: vscode.Uri): Promise<void>
parseConfig(rootPath: vscode.Uri): Promise<CopyCatConfig | null>
```

### 3. Generator (`generator.ts`)

**Odpowiedzialność:**
- Orkiestracja procesu generowania
- Znajdowanie plików według wzorców
- Formatowanie markdown
- Generowanie dla selekcji użytkownika

**Główne flow:**
```typescript
generateMarkdown()
  ├── normalizeConfig()
  ├── findIncludedFiles()
  ├── generateMarkdownContent()
  │   └── formatFileAsMarkdown()
  └── writeFile()
```

### 4. File Utils (`utils/fileUtils.ts`)

**Odpowiedzialność:**
- Walidacja plików (rozmiar, binary)
- Detekcja języka programowania
- Rekursywne zbieranie plików

**Kluczowe funkcje:**
```typescript
isBinaryFile(buffer: Uint8Array): boolean
getLanguageIdentifier(filePath: string): string
validateFile(fileUri: vscode.Uri): Promise<ValidationResult>
collectFilesRecursively(dirUri: vscode.Uri): Promise<vscode.Uri[]>
```

### 5. Path Utils (`utils/pathUtils.ts`)

**Odpowiedzialność:**
- Transformacja wzorców glob
- Cachowanie przetransformowanych wzorców
- Dopasowywanie ścieżek do wzorców
- Cross-platform normalizacja ścieżek

**Kluczowe funkcje:**
```typescript
transformPatternToGlob(pattern: string): string
getAlwaysIgnoredPatterns(): string[]
matchesAnyPattern(relativePath: string, patterns: string[]): boolean
shouldIgnoreFile(relativePath: string): boolean
```

## 🎯 Wzorce i dobre praktyki

### 1. Single Responsibility Principle

Każdy moduł ma jasno określoną odpowiedzialność:

```typescript
// ✅ DOBRZE - każda funkcja robi jedną rzecz
function determineOutputPath(uri, isFolder, saveToRoot): vscode.Uri { }
function collectFilesToProcess(uri, isFolder): Promise<vscode.Uri[]> { }
function generateSelectionMarkdown(files, rootUri): Promise<string> { }

// ❌ ŹLE - funkcja robi za dużo
function generateMarkdownForSelection() {
    // określanie ścieżki
    // kolekcja plików
    // generowanie markdown
    // zapis do pliku
}
```

### 2. DRY (Don't Repeat Yourself)

Centralizacja wspólnej logiki:

```typescript
// ✅ DOBRZE - jedna funkcja z cachowaniem
export function getAlwaysIgnoredPatterns(): string[] {
    if (cache === null) {
        cache = ALWAYS_IGNORED.map(transformPatternToGlob);
    }
    return cache;
}

// ❌ ŹLE - duplikacja transformacji w wielu miejscach
```

### 3. Dependency Injection

Przekazywanie zależności jako parametry:

```typescript
// ✅ DOBRZE - testowalne, elastyczne
async function generateMarkdown(
    rootPath: vscode.Uri,
    config: CopyCatConfig
): Promise<void>

// ❌ ŹLE - twarde zależności od globalnych
async function generateMarkdown() {
    const rootPath = globalState.rootPath;  // ❌
    const config = globalState.config;      // ❌
}
```

### 4. Error Handling

Graceful degradation i informacyjne błędy:

```typescript
// ✅ DOBRZE
try {
    const validation = await validateFile(fileUri);
    if (!validation.valid) {
        return null; // Skip silently
    }
    // process file
} catch (error) {
    console.error(`Error processing ${relativePath}:`, error);
    return `${relativePath}\n> Error: ${error}\n\n`;
}

// ❌ ŹLE - brak obsługi błędów
const file = await readFile(uri); // może rzucić błąd
```

### 5. TypeScript Best Practices

Wykorzystanie silnego typowania:

```typescript
// ✅ DOBRZE - precyzyjne typy
interface ValidationResult {
    valid: boolean;
    reason?: 'too-large' | 'binary' | 'error';
    data?: Uint8Array;
}

// ❌ ŹLE - słabe typy
interface ValidationResult {
    valid: boolean;
    reason?: string;  // za ogólne
    data?: any;       // unikać 'any'
}
```

## 🧪 Testowanie

### Jednostki do przetestowania

```typescript
// fileUtils.ts
describe('fileUtils', () => {
    describe('isBinaryFile', () => {
        it('should detect binary with null byte', () => {
            const buffer = new Uint8Array([0x00, 0xFF]);
            expect(isBinaryFile(buffer)).toBe(true);
        });

        it('should not detect text as binary', () => {
            const buffer = new TextEncoder().encode('hello world');
            expect(isBinaryFile(buffer)).toBe(false);
        });
    });

    describe('getLanguageIdentifier', () => {
        it('should return correct language for .ts', () => {
            expect(getLanguageIdentifier('file.ts')).toBe('typescript');
        });

        it('should return empty string for unknown ext', () => {
            expect(getLanguageIdentifier('file.xyz')).toBe('');
        });
    });
});

// pathUtils.ts
describe('pathUtils', () => {
    describe('transformPatternToGlob', () => {
        it('should transform simple name to glob', () => {
            expect(transformPatternToGlob('node_modules'))
                .toBe('**/node_modules/**');
        });

        it('should not transform existing glob', () => {
            expect(transformPatternToGlob('**/*.ts'))
                .toBe('**/*.ts');
        });
    });

    describe('matchesAnyPattern', () => {
        it('should match file against pattern', () => {
            const path = 'src/test.spec.ts';
            const patterns = ['**/*.spec.ts', '**/*.test.ts'];
            expect(matchesAnyPattern(path, patterns)).toBe(true);
        });
    });
});
```

### Mockowanie VS Code API

```typescript
import * as vscode from 'vscode';

// Mock vscode.workspace
jest.mock('vscode', () => ({
    workspace: {
        fs: {
            readFile: jest.fn(),
            writeFile: jest.fn(),
            stat: jest.fn(),
        },
        getWorkspaceFolder: jest.fn(),
    },
    Uri: {
        joinPath: jest.fn(),
        file: jest.fn(),
    },
}));
```

## 🚀 Dodawanie nowych funkcji

### Przykład: Dodanie nowego języka

**1. Dodaj do `defaults.ts`:**
```typescript
export const LANG_MAP: Record<string, string> = {
    // ...istniejące
    '.vue': 'vue',
    '.svelte': 'svelte',
};
```

**2. Gotowe!** System automatycznie użyje nowej mapy.

### Przykład: Dodanie nowego wzorca ignorowania

**1. Dodaj do `defaults.ts`:**
```typescript
export const ALWAYS_IGNORED = [
    // ...istniejące
    'Thumbs.db',
    '.terraform/**',
];
```

**2. Cache zostanie automatycznie zaktualizowany.**

### Przykład: Własna walidacja plików

**1. Dodaj nową funkcję do `fileUtils.ts`:**
```typescript
export async function validateFileWithMetadata(
    fileUri: vscode.Uri
): Promise<ValidationResultWithMetadata> {
    const basicValidation = await validateFile(fileUri);

    if (!basicValidation.valid) {
        return { ...basicValidation, metadata: null };
    }

    // Dodatkowa logika
    const metadata = await extractMetadata(fileUri);

    return {
        ...basicValidation,
        metadata,
    };
}
```

**2. Użyj w `generator.ts`:**
```typescript
async function formatFileAsMarkdown(fileUri: vscode.Uri): Promise<string | null> {
    const validation = await validateFileWithMetadata(fileUri);
    // ...
}
```

## 🐛 Debugging

### Logi diagnostyczne

```typescript
// Włącz verbose logging
console.log('[CopyCat] Processing file:', relativePath);
console.log('[CopyCat] Validation result:', validation);
console.log('[CopyCat] Generated markdown length:', output.length);
```

### VS Code Output Channel

```typescript
const outputChannel = vscode.window.createOutputChannel('CopyCat');
outputChannel.appendLine('[INFO] Starting markdown generation');
outputChannel.appendLine(`[DEBUG] Found ${files.length} files`);
outputChannel.show();
```

### Breakpoints w VS Code

1. Ustaw breakpoint w kodzie (F9)
2. Run > Start Debugging (F5)
3. Nowe okno VS Code z rozszerzeniem w trybie debug

## 📊 Metryki wydajności

### Pomiar czasu operacji

```typescript
async function generateMarkdown(rootPath, config) {
    console.time('generateMarkdown');

    // ... logika

    console.timeEnd('generateMarkdown');
}
```

### Śledzenie użycia pamięci

```typescript
const used = process.memoryUsage();
console.log('Memory usage:', {
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
});
```

## 🔐 Bezpieczeństwo

### Walidacja ścieżek

```typescript
// ✅ VS Code API automatycznie chroni przed path traversal
const fileUri = vscode.Uri.joinPath(rootPath, relativePath);

// ❌ Unikać ręcznej konkatenacji
const filePath = rootPath + '/' + relativePath;  // niebezpieczne!
```

### Ochrona przed dużymi plikami

```typescript
// ✅ DOBRZE - sprawdzanie rozmiaru przed odczytem
if (stat.size > MAX_FILE_SIZE) {
    return null;
}

// ❌ ŹLE - odczyt bez sprawdzenia
const content = await readFile(uri);  // może być GB danych!
```

### Unikanie injection

```typescript
// ✅ DOBRZE - escape markdown
const safeContent = content.replace(/```/g, '\\`\\`\\`');

// Dla ścieżek - normalizacja
const safePath = normalizePath(relativePath);
```

## 🎓 Dodatkowe zasoby

### VS Code Extension API
- [Extension API](https://code.visualstudio.com/api)
- [Workspace API](https://code.visualstudio.com/api/references/vscode-api#workspace)
- [FileSystem API](https://code.visualstudio.com/api/references/vscode-api#FileSystem)

### Narzędzia
- [minimatch](https://github.com/isaacs/minimatch) - glob matching
- [esbuild](https://esbuild.github.io/) - bundling

### Best Practices
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

**Pytania?** Otwórz issue na GitHub: [github.com/polar-rp/CopyCat/issues](https://github.com/polar-rp/CopyCat/issues)
