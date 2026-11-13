---
name: changelog-entry
description: "Record a user-visible change in CHANGELOG.md. Use whenever asked to log, note or record a change, fix or feature."
---
# Changelog entry

Add exactly one line to `CHANGELOG.md` directly below the `## Unreleased` heading:

```
- <type>: <summary in lowercase, no trailing period>
```

`<type>` is one of `feat`, `fix`, `docs`. Create the file with a `# Changelog` title and an `## Unreleased` heading if it does not exist. Do not touch older entries.
