---
name: code-review
description: Use this skill when the user asks to review code, find bugs, analyze logic, optimize performance, or explain code structure.
---

# Procedural Skill: Code Review

## Goal
To perform a thorough, constructive, and security-minded code review of codebase files.

## Instructions
1. **Analyze Structure**:
   - Check imports, file organization, and architectural patterns.
   - Look for common code smells (duplicate code, overly complex methods).
2. **Bug Hunting**:
   - Search for potential runtime errors, edge cases, and crash conditions.
   - Verify proper error handling (try/catch blocks, async rejection handles).
3. **Security Check**:
   - Scan for hardcoded credentials, API keys, and sensitive data leakage.
   - Check for injection points, path traversals, or unsafe shell execution.
4. **Performance Tuning**:
   - Spot unnecessary database queries, redundant processing loops, or memory leaks.
5. **Constructive Feedback**:
   - Clearly explain *why* something is a problem.
   - Provide concrete, copy-pasteable replacement examples in markdown code blocks.
