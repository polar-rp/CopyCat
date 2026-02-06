# CopyCat

**Automatically export your codebase to a single Markdown file**

CopyCat is a VS Code extension that monitors your workspace and automatically generates a consolidated `copycat.md` file containing all your selected source code files. Perfect for sharing code with AI assistants, documentation, code reviews, or creating snapshots of your project structure.

![Demo](https://github.com/polar-rp/CopyCat/blob/main/example.gif?raw=true)

## Features

- **Auto-Update**: Automatically regenerates the Markdown file when you save, create, delete, or rename files
- **Flexible Configuration**: Simple `.copycat` config file with include/exclude patterns using glob syntax
- **Smart File Detection**:
  - Automatically skips binary files
  - Configurable file size limits (default: 100KB)
  - Syntax highlighting for 20+ languages
- **Performance Optimized**:
  - Debounced updates (1s delay) to avoid overwhelming your system
  - Efficient file scanning with VS Code's native file system API
- **Visual Feedback**: Status bar indicator shows current operation status
- **Multi-root Support**: Works seamlessly with VS Code multi-root workspaces

## Installation

### From Marketplace

> https://marketplace.visualstudio.com/items?itemName=Polar-rp.copy-cat-polar

## Getting Started

### 1. Initialize CopyCat

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:

```
CopyCat: Initialize
```

This creates a `.copycat` configuration file in your workspace root.

### 2. Configure Your Patterns

Edit the `.copycat` file to specify which files to include or exclude:

```ini
# CopyCat Config

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
```

### 3. Activates automatically

CopyCat will automatically update `copycat.md` whenever you:

- Save a file (`Ctrl+S` / `Cmd+S`)
- Create a new file
- Delete a file
- Rename/move a file

## Use Cases

- **AI Assistance**: Quickly share your entire codebase with ChatGPT, Claude, or other AI assistants in a single file
- **Documentation**: Generate comprehensive code documentation for wikis or knowledge bases
- **Code Reviews**: Create reviewable snapshots of your project state
- **Teaching**: Share complete project structures with students or team members
- **Archiving**: Create portable code snapshots for backup or reference

## Configuration Examples

### Frontend Project

```ini
[INCLUDE]
src/**/*.tsx
src/**/*.ts
src/**/*.css
public/index.html
package.json

[IGNORE]
node_modules/**
build/**
**/*.test.ts
```

### Full-Stack Application

```ini
[INCLUDE]
frontend/src/**
backend/src/**
shared/**
prisma/schema.prisma
docker-compose.yml
package.json

[IGNORE]
**/node_modules/**
**/dist/**
**/.env*
**/*.log
```

### Python Project

```ini
[INCLUDE]
src/**/*.py
tests/**/*.py
requirements.txt
README.md

[IGNORE]
**/__pycache__/**
**/*.pyc
.venv/**
venv/**
```

## Output Format

The generated `copycat.md` file contains:

````markdown
path/to/file1.ts

```typescript
// Your code here
```
````

path/to/file2.py

```python
# Your code here
```

> Skipped: Binary file detected

path/to/large-file.json

> Skipped: File too large (150.5KB)

````

## Technical Details

### Supported Languages
TypeScript, JavaScript, Python, Java, C/C++, Go, Rust, PHP, Ruby, HTML, CSS, SCSS, JSON, YAML, XML, SQL, Bash, Prisma, and more.

### File Size Limits
- Default maximum: **100KB** per file
- Larger files are skipped with a note in the output

### Binary Detection
Files containing null bytes in the first 1KB are automatically detected and skipped as binary files.

### Debouncing
Updates are debounced with a 1-second delay to prevent excessive regeneration during rapid file changes.

## Known Issues

- Status bar may briefly show "Error" status if `.copycat` configuration has invalid glob patterns
- Very large workspaces (1000+ matching files) may take several seconds to process

## Development

### Prerequisites
- Node.js 22.x or higher
- VS Code 1.109.0 or higher

### Build Commands
```bash
npm install          # Install dependencies
npm run compile      # Build extension
npm run watch        # Watch mode for development
npm run test         # Run tests
npm run lint         # Lint code
````

### Project Structure

```
copy-cat/
├── src/
│   ├── extension.ts          # Main extension entry point
│   ├── copycat/
│   │   ├── config.ts         # Configuration parser
│   │   └── generator.ts      # Markdown generator
│   └── test/
│       └── extension.test.ts # Test suite
├── .copycat                  # Example configuration
└── package.json              # Extension manifest
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

Built with:

- [VS Code Extension API](https://code.visualstudio.com/api)
- [esbuild](https://esbuild.github.io/) for blazing fast bundling
- TypeScript for type safety

---

**Enjoy coding with CopyCat!**

If you find this extension useful, please consider giving it a ⭐ on GitHub!
