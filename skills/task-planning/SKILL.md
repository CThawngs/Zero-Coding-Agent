---
name: task-planning
description: Use this skill when the user requests a complex task, multi-step implementation, refactoring, or project plan. Trigger on task planning, goals, and checklists.
---

# Procedural Skill: Task Planning

## Goal
To organize complex user requests into structured, logical, and executable step-by-step plans.

## Instructions
1. **Analyze Requirements**:
   - Break down the user prompt into individual features, modules, or file changes.
   - Identify dependencies between tasks (e.g., database schema changes must be applied before API changes).
2. **Draft a Task Checklist**:
   - Write or update a task checklist in a markdown format.
   - Use completion states: `[ ]` for pending, `[/]` for in-progress, and `[x]` for completed tasks.
3. **Phased Execution**:
   - Work incrementally, focusing on one subtask at a time.
   - Validate and test each subtask before moving to the next one to avoid regression.
4. **Communicate Progress**:
   - At each turn, update the user on which steps are complete, which step is currently active, and what remains.
