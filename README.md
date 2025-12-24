# Git-Style Diff Checker

A professional text/code difference checker with GitHub-style UI and git diff functionality.

## Features

- 🎨 GitHub dark theme UI
- 🔍 Git-style diff with hunks and context
- 📝 Inline word-level highlighting
- 🔄 Merge left/right functionality
- ⬇️ Download merged files
- 📊 Addition/deletion statistics
- 🎯 Smart context display (3 lines around changes)

## Installation

1. Extract the ZIP file or clone this Repo
2. Navigate to the project directory:
   ```bash
   cd diff-checker
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start the server:
   ```bash
   npm start
   ```

2. Open your browser and go to:
   ```
   http://localhost:3000
   ```

3. Paste your code in left and right panels
4. Click "Compare Files" to see the diff
5. Use merge buttons to sync content
6. Download the merged result

## Development

For auto-restart on file changes:
```bash
npm run dev
```

## How It Works

- **LCS Algorithm**: Uses Longest Common Subsequence for accurate diff
- **Hunk Grouping**: Groups changes with 3 lines of context (like git)
- **Inline Diff**: Word-level highlighting for modified lines
- **Color Coding**:
  - 🟢 Green: Added lines
  - 🔴 Red: Deleted lines
  - 🟠 Orange: Modified lines

## Requirements

- Node.js 14+ 
- npm or yarn

## License

MIT
