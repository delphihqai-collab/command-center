# Command Center — GitHub Copilot Instructions

**Status:** Scaffold only — to be completed by HERMES after V1 build is finished.

This file contains persistent behavioral instructions for GitHub Copilot operating in this repository. These rules apply across all tasks.

## What Gets Added Here (post-build)
- Coding style: TypeScript strict mode, functional React components, no class components
- Naming conventions: file names, component names, database field names
- Architecture rules: what belongs in which layer, data access patterns
- What Copilot must never do autonomously (DB migrations, auth changes, env var exposure)
- Supabase patterns: how to query, how to handle RLS, how to use generated types
- Testing requirements

## Do Not Edit Until Instructed
HERMES will read the completed codebase and generate the full content for this file.
