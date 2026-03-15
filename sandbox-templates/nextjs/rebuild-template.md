# Rebuilding the E2B Sandbox Template

This guide explains how to rebuild your E2B sandbox template after making changes to `e2b.Dockerfile` or `compile_page.sh`.

## Prerequisites

1. Install E2B CLI (if not already installed):
   ```bash
   npm install -g @e2b/cli
   ```

2. Authenticate with E2B:
   ```bash
   e2b auth login
   ```

## Rebuild Steps

From the `sandbox-templates/nextjs/` directory:

```bash
cd sandbox-templates/nextjs
e2b templates build --name uigen-nextjs-build
```

Or if using the template ID:

```bash
e2b templates build --id 2uq5kp8t8s068kjjugf4
```

## Alternative: Using E2B SDK (Node.js)

If you prefer using the SDK programmatically:

```typescript
import { Template } from "e2b";

const template = await Template.build({
  name: "uigen-nextjs-build",
  dockerfile: "./e2b.Dockerfile",
  startCmd: "/compile_page.sh",
});
```

## Verify Template

After rebuilding, verify the template exists:

```bash
e2b templates list
```

You should see `uigen-nextjs-build` in the list with an updated timestamp.

## Important Notes

- After rebuilding, your Inngest function will automatically use the new template (it references by name: `uigen-nextjs-build`)
- The template includes the updated `compile_page.sh` script that properly kills existing processes
- Template rebuilds can take 5-10 minutes depending on Docker image size
