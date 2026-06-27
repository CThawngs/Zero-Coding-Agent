---
name: file-operations
description: Use this skill when the user asks to read, write, create, or edit files, or list contents of local directories. Trigger on file operations.
---

# Procedural Skill: File Operations

## Goal
To safely and systematically view, create, and modify codebase files on the local filesystem.

## Instructions
1. **Locate and Analyze**:
   - Before editing, always read the target file contents first using `read_file` tool to understand context.
   - Do not guess the existing file structure or code.
2. **Double Check Paths**:
   - Verify that paths are relative to the active workspace.
   - Ensure the path is correct and exists before attempting writes.
3. **Incremental Changes**:
   - Avoid completely overwriting files if only small changes are needed.
   - Present code modifications clearly.
4. **Safety & Policy**:
   - Never write credentials, tokens, or API keys directly to repository files. Use environment variables.
   - If writing new files, ensure parent directories exist or create them.

## Constraints
- Never delete files without explicit user permission.
- Always output valid code syntax matching the language of the target file.
