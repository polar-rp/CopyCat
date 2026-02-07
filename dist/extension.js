"use strict";var P=Object.create;var v=Object.defineProperty;var L=Object.getOwnPropertyDescriptor;var N=Object.getOwnPropertyNames;var j=Object.getPrototypeOf,A=Object.prototype.hasOwnProperty;var $=(o,e)=>{for(var s in e)v(o,s,{get:e[s],enumerable:!0})},k=(o,e,s,n)=>{if(e&&typeof e=="object"||typeof e=="function")for(let t of N(e))!A.call(o,t)&&t!==s&&v(o,t,{get:()=>e[t],enumerable:!(n=L(e,t))||n.enumerable});return o};var w=(o,e,s)=>(s=o!=null?P(j(o)):{},k(e||!o||!o.__esModule?v(s,"default",{value:o,enumerable:!0}):s,o)),R=o=>k(v({},"__esModule",{value:!0}),o);var z={};$(z,{activate:()=>B,deactivate:()=>q});module.exports=R(z);var r=w(require("vscode"));var p=w(require("vscode"));var x=`
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

`,E={".ts":"typescript",".tsx":"tsx",".js":"javascript",".jsx":"jsx",".json":"json",".html":"html",".css":"css",".scss":"scss",".md":"markdown",".py":"python",".java":"java",".c":"c",".cpp":"cpp",".go":"go",".rs":"rust",".php":"php",".rb":"ruby",".sh":"bash",".yaml":"yaml",".yml":"yaml",".xml":"xml",".sql":"sql",".prisma":"prisma"},U=["copycat.md",".copycat",".git/**",".gitattributes",".gitkeep","node_modules/**","vendor/**","bower_components/**","package-lock.json","yarn.lock","pnpm-lock.yaml","bun.lockb","composer.lock","Gemfile.lock","go.sum","Cargo.lock","poetry.lock","Pipfile.lock",".vscode/**",".idea/**",".fleet/**","*.swp","*.swo","*.swn","*~",".vim/**",".netrwhist",".DS_Store","Thumbs.db","desktop.ini","ehthumbs.db","*.lnk","**/*.log","npm-debug.log*","yarn-debug.log*","yarn-error.log*","lerna-debug.log*","pnpm-debug.log*",".cache/**",".turbo/**",".next/**",".nuxt/**",".svelte-kit/**",".angular/**","__pycache__/**","*.pyc","*.pyo","*.pyd",".pytest_cache/**",".mypy_cache/**",".ruff_cache/**",".tox/**","*.egg-info/**","tmp/**","temp/**","*.tmp","**/*.map","**/*.min.js","**/*.min.css",".nyc_output/**",".coverage","htmlcov/**","coverage/**","*.cover",".hypothesis/**","*.db","*.sqlite","*.sqlite3",".env.local",".env.*.local"];async function b(o){let e=p.Uri.joinPath(o,".copycat");try{await p.workspace.fs.stat(e),p.window.showInformationMessage(".copycat config already exists.")}catch{await p.workspace.fs.writeFile(e,Buffer.from(x,"utf8")),p.window.showInformationMessage("Created .copycat configuration file.")}}async function I(o){let e=p.Uri.joinPath(o,".copycat"),s="";try{s=(await p.workspace.fs.readFile(e)).toString()}catch{return null}let n={include:[],ignore:[]},t=null,d=s.split(/\r?\n/);for(let i of d){let c=i.trim();if(!(!c||c.startsWith("#"))){if(c==="[INCLUDE]"){t="INCLUDE";continue}if(c==="[IGNORE]"){t="IGNORE";continue}t==="INCLUDE"?n.include.push(c):t==="IGNORE"&&n.ignore.push(c)}}return n}var l=w(require("vscode")),S=w(require("path"));async function _(o,e){let s=l.Uri.joinPath(o,"copycat.md");e.include.length===0&&(e.include=["**/*"]);let n=[...e.ignore,...U],t=e.include.length>1?`{${e.include.join(",")}}`:e.include[0],d=n.length>1?`{${n.join(",")}}`:n[0]||void 0,i=new l.RelativePattern(o,t),c=[];try{c=await l.workspace.findFiles(i,d)}catch(u){l.window.showErrorMessage(`CopyCat: Invalid glob pattern. ${u}`);return}c.sort((u,m)=>u.fsPath.localeCompare(m.fsPath));let f="";for(let u of c){if(u.fsPath===s.fsPath)continue;let m=l.workspace.asRelativePath(u,!1);try{let g=await l.workspace.fs.stat(u);if(g.size>102400){f+=`${m}
> Skipped: File too large (${(g.size/1024).toFixed(1)}KB)

`;continue}let C=await l.workspace.fs.readFile(u);if(G(C)){f+=`${m}
> Skipped: Binary file detected

`;continue}let F=C.toString(),D=T(u.fsPath);f+=`${m}
`,f+="```"+D+`
`,f+=F+`
`,f+="```\n\n"}catch(g){console.error(`Error reading file ${m}:`,g),f+=`${m}
`,f+=`> Error reading file: ${g}

`}}await l.workspace.fs.writeFile(s,Buffer.from(f,"utf8"))}function T(o){let e=S.extname(o).toLowerCase();return E[e]??""}function G(o){let e=Math.min(o.length,1024);for(let s=0;s<e;s++)if(o[s]===0)return!0;return!1}var y=new Map,O=1e3,a;function B(o){console.log("CopyCat is active!"),a=r.window.createStatusBarItem(r.StatusBarAlignment.Left,100),a.command="copy-cat.initialize",o.subscriptions.push(a);let e=r.commands.registerCommand("copy-cat.initialize",async()=>{let t=r.workspace.workspaceFolders?.[0];if(!t){r.window.showErrorMessage("CopyCat requires an open folder.");return}await b(t.uri),h(t)});o.subscriptions.push(e);let s=t=>{if(t.fsPath.endsWith("copycat.md"))return;let d=r.workspace.getWorkspaceFolder(t);d&&h(d)},n=t=>{let d=new Set;for(let i of t){let c=r.workspace.getWorkspaceFolder(i);c&&d.add(c)}d.forEach(i=>h(i))};o.subscriptions.push(r.workspace.onDidSaveTextDocument(t=>s(t.uri)),r.workspace.onDidCreateFiles(t=>n(t.files)),r.workspace.onDidDeleteFiles(t=>n(t.files)),r.workspace.onDidRenameFiles(t=>{let d=[...t.files.map(i=>i.oldUri),...t.files.map(i=>i.newUri)];n(d)}))}function h(o){let e=o.uri.toString(),s=y.get(e);s&&clearTimeout(s);let n=setTimeout(()=>{y.delete(e),W(o)},O);y.set(e,n)}async function W(o){a.text="$(sync~spin) CopyCat: Updating...",a.show(),await r.window.withProgress({location:r.ProgressLocation.Window,title:`CopyCat: Updating ${o.name}...`},async()=>{try{let e=await I(o.uri);if(!e){a.text="$(circle-slash) CopyCat: No config",a.tooltip='Run "CopyCat: Initialize" to create .copycat file';return}await _(o.uri,e),a.text="$(check) CopyCat: Ready",a.tooltip=void 0}catch(e){console.error("CopyCat Error:",e),a.text="$(alert) CopyCat: Error",e instanceof Error?r.window.showErrorMessage(`CopyCat: ${e.message}`):r.window.showErrorMessage("CopyCat: Unknown error occurred.")}finally{setTimeout(()=>{a.text==="$(check) CopyCat: Ready"&&a.hide()},3e3)}})}function q(){for(let o of y.values())clearTimeout(o);y.clear(),a.dispose()}0&&(module.exports={activate,deactivate});
