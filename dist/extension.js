"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode3 = __toESM(require("vscode"));

// src/copycat/config.ts
var vscode = __toESM(require("vscode"));

// src/copycat/defaults.ts
var MAX_FILE_SIZE = 1024 * 100;
var DEFAULT_CONFIG = `
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

`;
var LANG_MAP = {
  ".ts": "typescript",
  ".tsx": "tsx",
  ".js": "javascript",
  ".jsx": "jsx",
  ".json": "json",
  ".html": "html",
  ".css": "css",
  ".scss": "scss",
  ".md": "markdown",
  ".py": "python",
  ".java": "java",
  ".c": "c",
  ".cpp": "cpp",
  ".go": "go",
  ".rs": "rust",
  ".php": "php",
  ".rb": "ruby",
  ".sh": "bash",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".xml": "xml",
  ".sql": "sql",
  ".prisma": "prisma"
};
var ALWAYS_IGNORED = [
  // CopyCat own files
  "copycat.md",
  ".copycat",
  // Version control
  ".git/**",
  ".gitattributes",
  ".gitkeep",
  // Dependencies
  "node_modules/**",
  "vendor/**",
  "bower_components/**",
  // Lock files
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  "composer.lock",
  "Gemfile.lock",
  "go.sum",
  "Cargo.lock",
  "poetry.lock",
  "Pipfile.lock",
  // IDE and editors
  ".vscode/**",
  ".idea/**",
  ".fleet/**",
  "*.swp",
  "*.swo",
  "*.swn",
  "*~",
  ".vim/**",
  ".netrwhist",
  // OS files
  ".DS_Store",
  "Thumbs.db",
  "desktop.ini",
  "ehthumbs.db",
  "*.lnk",
  // Logs
  "**/*.log",
  "npm-debug.log*",
  "yarn-debug.log*",
  "yarn-error.log*",
  "lerna-debug.log*",
  "pnpm-debug.log*",
  // Cache and build artifacts
  ".cache/**",
  ".turbo/**",
  ".next/**",
  ".nuxt/**",
  ".svelte-kit/**",
  ".angular/**",
  "__pycache__/**",
  "*.pyc",
  "*.pyo",
  "*.pyd",
  ".pytest_cache/**",
  ".mypy_cache/**",
  ".ruff_cache/**",
  ".tox/**",
  "*.egg-info/**",
  // Temporary files
  "tmp/**",
  "temp/**",
  "*.tmp",
  // Source maps and compiled outputs
  "**/*.map",
  "**/*.min.js",
  "**/*.min.css",
  // Coverage and test outputs
  ".nyc_output/**",
  ".coverage",
  "htmlcov/**",
  "coverage/**",
  "*.cover",
  ".hypothesis/**",
  // Database files
  "*.db",
  "*.sqlite",
  "*.sqlite3",
  // Environment and secrets (extra safety)
  ".env.local",
  ".env.*.local"
];

// src/copycat/config.ts
async function createDefaultConfig(rootPath) {
  const configUri = vscode.Uri.joinPath(rootPath, ".copycat");
  try {
    await vscode.workspace.fs.stat(configUri);
    vscode.window.showInformationMessage(".copycat config already exists.");
  } catch {
    await vscode.workspace.fs.writeFile(configUri, Buffer.from(DEFAULT_CONFIG, "utf8"));
    vscode.window.showInformationMessage("Created .copycat configuration file.");
  }
}
async function parseConfig(rootPath) {
  const configUri = vscode.Uri.joinPath(rootPath, ".copycat");
  let content = "";
  try {
    const fileData = await vscode.workspace.fs.readFile(configUri);
    content = fileData.toString();
  } catch (error) {
    throw new Error('Configuration file .copycat not found. Run "CopyCat: Initialize" to create it.');
  }
  const config = {
    include: [],
    ignore: []
  };
  let currentSection = null;
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    if (trimmed === "[INCLUDE]") {
      currentSection = "INCLUDE";
      continue;
    }
    if (trimmed === "[IGNORE]") {
      currentSection = "IGNORE";
      continue;
    }
    if (currentSection === "INCLUDE") {
      config.include.push(trimmed);
    } else if (currentSection === "IGNORE") {
      config.ignore.push(trimmed);
    }
  }
  return config;
}

// src/copycat/generator.ts
var vscode2 = __toESM(require("vscode"));
var path = __toESM(require("path"));
async function generateMarkdown(rootPath, config) {
  const mdPath = vscode2.Uri.joinPath(rootPath, "copycat.md");
  if (config.include.length === 0) {
    config.include = ["**/*"];
  }
  const ignorePatterns = [...config.ignore, ...ALWAYS_IGNORED];
  const includeString = config.include.length > 1 ? `{${config.include.join(",")}}` : config.include[0];
  const excludeString = ignorePatterns.length > 1 ? `{${ignorePatterns.join(",")}}` : ignorePatterns[0] || void 0;
  const includePattern = new vscode2.RelativePattern(rootPath, includeString);
  let files = [];
  try {
    files = await vscode2.workspace.findFiles(includePattern, excludeString);
  } catch (err) {
    vscode2.window.showErrorMessage(`CopyCat: Invalid glob pattern. ${err}`);
    return;
  }
  files.sort((a, b) => a.fsPath.localeCompare(b.fsPath));
  let output = "";
  for (const fileUri of files) {
    if (fileUri.fsPath === mdPath.fsPath) {
      continue;
    }
    const relativePath = vscode2.workspace.asRelativePath(fileUri, false);
    try {
      const stat = await vscode2.workspace.fs.stat(fileUri);
      if (stat.size > MAX_FILE_SIZE) {
        output += `${relativePath}
> Skipped: File too large (${(stat.size / 1024).toFixed(1)}KB)

`;
        continue;
      }
      const fileData = await vscode2.workspace.fs.readFile(fileUri);
      if (isBinary(fileData)) {
        output += `${relativePath}
> Skipped: Binary file detected

`;
        continue;
      }
      const content = fileData.toString();
      const language = getLanguageFromExtension(fileUri.fsPath);
      output += `${relativePath}
`;
      output += "```" + language + "\n";
      output += content + "\n";
      output += "```\n\n";
    } catch (err) {
      console.error(`Error reading file ${relativePath}:`, err);
      output += `${relativePath}
`;
      output += `> Error reading file: ${err}

`;
    }
  }
  await vscode2.workspace.fs.writeFile(mdPath, Buffer.from(output, "utf8"));
}
function getLanguageFromExtension(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return LANG_MAP[ext] ?? "";
}
function isBinary(buffer) {
  const checkLen = Math.min(buffer.length, 1024);
  for (let i = 0; i < checkLen; i++) {
    if (buffer[i] === 0) {
      return true;
    }
  }
  return false;
}

// src/extension.ts
var workspaceTimers = /* @__PURE__ */ new Map();
var DEBOUNCE_DELAY = 1e3;
var statusBarItem;
function activate(context) {
  console.log("CopyCat is active!");
  statusBarItem = vscode3.window.createStatusBarItem(vscode3.StatusBarAlignment.Left, 100);
  statusBarItem.command = "copy-cat.initialize";
  context.subscriptions.push(statusBarItem);
  const initCommand = vscode3.commands.registerCommand("copy-cat.initialize", async () => {
    const folder = vscode3.workspace.workspaceFolders?.[0];
    if (!folder) {
      vscode3.window.showErrorMessage("CopyCat requires an open folder.");
      return;
    }
    await createDefaultConfig(folder.uri);
    triggerUpdate(folder);
  });
  context.subscriptions.push(initCommand);
  const triggerForUri = (uri) => {
    if (uri.fsPath.endsWith("copycat.md")) {
      return;
    }
    const folder = vscode3.workspace.getWorkspaceFolder(uri);
    if (folder) {
      triggerUpdate(folder);
    }
  };
  const triggerForUris = (uris) => {
    const affectedFolders = /* @__PURE__ */ new Set();
    for (const uri of uris) {
      const folder = vscode3.workspace.getWorkspaceFolder(uri);
      if (folder) {
        affectedFolders.add(folder);
      }
    }
    affectedFolders.forEach((folder) => triggerUpdate(folder));
  };
  context.subscriptions.push(
    vscode3.workspace.onDidSaveTextDocument((doc) => triggerForUri(doc.uri)),
    vscode3.workspace.onDidCreateFiles((e) => triggerForUris(e.files)),
    vscode3.workspace.onDidDeleteFiles((e) => triggerForUris(e.files)),
    vscode3.workspace.onDidRenameFiles((e) => {
      const allUris = [...e.files.map((f) => f.oldUri), ...e.files.map((f) => f.newUri)];
      triggerForUris(allUris);
    })
  );
}
function triggerUpdate(folder) {
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
async function runUpdate(folder) {
  statusBarItem.text = "$(sync~spin) CopyCat: Updating...";
  statusBarItem.show();
  await vscode3.window.withProgress({
    location: vscode3.ProgressLocation.Window,
    title: `CopyCat: Updating ${folder.name}...`
  }, async () => {
    try {
      const config = await parseConfig(folder.uri);
      await generateMarkdown(folder.uri, config);
      statusBarItem.text = "$(check) CopyCat: Ready";
    } catch (error) {
      console.error("CopyCat Error:", error);
      statusBarItem.text = "$(alert) CopyCat: Error";
      if (error instanceof Error) {
        vscode3.window.showErrorMessage(`CopyCat: ${error.message}`);
      } else {
        vscode3.window.showErrorMessage(`CopyCat: Unknown error occurred.`);
      }
    } finally {
      setTimeout(() => {
        if (statusBarItem.text === "$(check) CopyCat: Ready") {
          statusBarItem.hide();
        }
      }, 3e3);
    }
  });
}
function deactivate() {
  for (const timer of workspaceTimers.values()) {
    clearTimeout(timer);
  }
  workspaceTimers.clear();
  statusBarItem.dispose();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
