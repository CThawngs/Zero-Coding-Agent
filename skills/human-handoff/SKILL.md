---
name: human-handoff
description: Use this skill when you need user approval, feedback, configuration values, credentials, or when completing a major phase. Trigger on human-in-the-loop, handoff, approval, and checkpoint.
---

# Procedural Skill: Human Handoff and Resume

## Goal
To safely halt execution, obtain human review, inputs, or approvals, and resume once the user provides confirmation.

## Instructions
1. **Identify Triggers**:
   - Destructive operations (deleting database rows/files, overwriting critical files).
   - High-risk operations (running complex scripts, executing commands with external side-effects).
   - Missing information (requesting API keys, server URLs, folder paths).
2. **Present Clear Context**:
   - Explain exactly what action requires approval or what information is missing.
   - Show code/configuration diffs or details of the command about to be run.
3. **Wait for Approval**:
   - Stop processing and wait for the user to approve the pending action via the interface.
   - Do not make assumptions or proceed with the blocked action until confirmation is received.
4. **Resume Flow**:
   - Once the action is approved or input is provided, continue executing the remaining steps of the plan.
