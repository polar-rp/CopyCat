export const MAX_FILE_SIZE = 1024 * 100; // 100KB

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

dist/**
build/**
out/**

.next/**
.nuxt/**

**/*.test.ts
**/*.spec.ts
coverage/**

# Note: The following are ALWAYS ignored automatically:
# - Version control (.git), dependencies (node_modules, vendor)
# - Lock files (package-lock.json, yarn.lock, Cargo.lock, etc.)
# - IDE files (.vscode, .idea, *.swp)
# - OS files (.DS_Store, Thumbs.db, desktop.ini)
# - Build outputs (.next, dist, build, __pycache__, *.pyc)
# - Logs (*.log), cache (.cache, .turbo), temp files
# - Source maps (*.map), coverage, and database files (*.db, *.sqlite)

`
;

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
};

// Files and folders that are ALWAYS ignored, regardless of user config
// These are system files, dependencies, build artifacts, and logs that should never be tracked
export const ALWAYS_IGNORED = [
    // CopyCat own files
    'copycat.md',
    '.copycat',
    
    // Version control
    '.git/**',
    '.gitattributes',
    '.gitkeep',
    
    // Dependencies
    'node_modules/**',
    'vendor/**',
    'bower_components/**',
    
    // Lock files
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'bun.lockb',
    'composer.lock',
    'Gemfile.lock',
    'go.sum',
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
