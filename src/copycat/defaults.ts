/**
 * Default constants and configuration templates for CopyCat
 */

/**
 * Maximum file size to process in bytes.
 * Files larger than this will be automatically skipped.
 * Default: 100KB (102,400 bytes)
 */
export const MAX_FILE_SIZE = 1024 * 100;

/**
 * Default configuration template used when initializing a new .copycat file.
 * Includes example patterns and comprehensive comments.
 */
export const DEFAULT_CONFIG = 
`
# CopyCat Config

# Specify folders or files to include
# e.g. src/components/**
# all files in src/components and subfolders will be included
[INCLUDE]

src/**
prisma/schema.prisma
package.json


# Specify folders or files to exclude 
# Use this section to add PROJECT-SPECIFIC ignore patterns:
[IGNORE]

.env*

**/dist/**
**/build/**
**/out/**

**/*.test.ts
**/*.spec.ts
coverage/**

# Note: The following are ALWAYS ignored automatically:
# - Version control (.git), dependencies (node_modules, vendor)
# - Lock files (package-lock.json, yarn.lock, Cargo.lock, etc.)
# - IDE files (.vscode, .idea, *.swp)
# - OS files (.DS_Store, Thumbs.db, desktop.ini)
# - Build outputs (.next, .nuxt, __pycache__, *.pyc)
# - Logs (*.log), cache (.cache, .turbo), temp files
# - Source maps (*.map), coverage, and database files (*.db, *.sqlite)

`
;

/**
 * Mapping of file extensions to language identifiers for markdown code blocks.
 * Used for syntax highlighting in generated markdown files.
 */
export const LANG_MAP: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.json': 'json',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.md': 'markdown',
    '.py': 'python',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.go': 'go',
    '.rs': 'rust',
    '.php': 'php',
    '.rb': 'ruby',
    '.sh': 'bash',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.xml': 'xml',
    '.sql': 'sql',
    '.prisma': 'prisma',
    '.lua': 'lua',
    '.swift': 'swift',
    '.kotlin': 'kotlin',
    '.clojure': 'clojure',
    '.clj': 'clojure',
    '.vim': 'vim',
    '.vimrc': 'vim',
    '.toml': 'toml',
    '.r': 'r',
    '.R': 'r',
    '.scala': 'scala',
    '.gradle': 'gradle',
    '.m': 'objective-c',
    '.mm': 'objective-c++',
    '.dart': 'dart',
    '.pl': 'perl',
    '.ex': 'elixir',
    '.exs': 'elixir',
};

/**
 * Files and folders that are ALWAYS ignored, regardless of user configuration.
 * These patterns cover:
 * - Version control directories (.git)
 * - Package managers and dependencies (node_modules, vendor, etc.)
 * - Lock files (package-lock.json, yarn.lock, Cargo.lock, etc.)
 * - IDE and editor files (.vscode, .idea, *.swp)
 * - Operating system files (.DS_Store, Thumbs.db)
 * - Build artifacts and caches (.next, .nuxt, __pycache__)
 * - Log files and temporary files
 * - Source maps and minified files
 * - Test coverage and database files
 *
 * These patterns protect against accidentally including sensitive or unnecessary files.
 * Simple folder names (without wildcards) will be automatically transformed to ** /name/**  patterns.
 */
export const ALWAYS_IGNORED = [
    // CopyCat own files
    'copycat.md',
    '.copycat',
    
    // Version control
    '.git/**',
    '.gitattributes',
    '.gitkeep',
    
    // Dependencies and package caches (in any location in the tree)
    'node_modules',
    'vendor',
    'bower_components',
    '.cargo',
    
    // Lock files
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'bun.lockb',
    'composer.lock',
    'Gemfile.lock',
    'go.sum',
    'cargo',
    'Cargo.lock',
    'poetry.lock',
    'Pipfile.lock',
    
    // IDE and editors
    '.vscode/**',
    '.idea/**',
    '.fleet/**',
    '*.swp',
    '*.swo',
    '*.swn',
    '*~',
    '.vim/**',
    '.netrwhist',
    
    // OS files
    '.DS_Store',
    'Thumbs.db',
    'desktop.ini',
    'ehthumbs.db',
    '*.lnk',
    
    // Logs
    '**/*.log',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*',
    'lerna-debug.log*',
    'pnpm-debug.log*',
    
    // Cache and build artifacts
    'target',
    'gen',
    '.cache/**',
    '.turbo/**',
    '.next/**',
    '.nuxt/**',
    '.svelte-kit/**',
    '.angular/**',
    '__pycache__/**',
    '*.pyc',
    '*.pyo',
    '*.pyd',
    '.pytest_cache/**',
    '.mypy_cache/**',
    '.ruff_cache/**',
    '.tox/**',
    '*.egg-info/**',
    
    // Temporary files
    'tmp/**',
    'temp/**',
    '*.tmp',
    
    // Source maps and compiled outputs
    '**/*.map',
    '**/*.min.js',
    '**/*.min.css',
    
    // Coverage and test outputs
    '.nyc_output/**',
    '.coverage',
    'htmlcov/**',
    'coverage/**',
    '*.cover',
    '.hypothesis/**',
    
    // Database files
    '*.db',
    '*.sqlite',
    '*.sqlite3',
    
    // Environment and secrets (extra safety)
    '.env.local',
    '.env.*.local'
];
