# Steering Files

This directory contains steering files that provide additional context and instructions to Kiro.

## Types of Steering Files

### Always Included
Files without front-matter or with `inclusion: always` are automatically included in all interactions.

### Conditional Inclusion
Files with `inclusion: fileMatch` and a `fileMatchPattern` are included when matching files are read.

Example:
```yaml
---
inclusion: fileMatch
fileMatchPattern: "**/*.tsx"
---
```

### Manual Inclusion
Files with `inclusion: manual` are only included when explicitly referenced with `#steering-file-name`.

Example:
```yaml
---
inclusion: manual
---
```

## File References
You can reference other files using the syntax: `#[[file:relative/path/to/file.ext]]`

This allows you to include specifications, schemas, or other documentation directly in your steering files.