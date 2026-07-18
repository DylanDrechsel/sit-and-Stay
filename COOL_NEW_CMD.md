# Cool New Commands!

> **Purpose of this document**: AI has been running a lot of commands. Some of them I understand, some of them I have never seen before, and alot of the commands are like the first example where I know half of what the command does.
> This file is just to keep track of the new syntax I learn!

---------------------------------------------------------------------

## `2>&1 | tail -n 80`

```bash
npm run build 2>&1 | tail -n 80
```

**What it does:** Runs the build and shows only the last 80 lines of output.

| Piece | Meaning |
|---|---|
| `2>&1` | Redirects **stderr** (file descriptor 2) into **stdout** (file descriptor 1), so error messages and normal output are merged into one stream |
| `\|` | **Pipe** — takes the combined output and sends it as input to the next command |
| `tail -n 80` | Prints only the **last 80 lines** of whatever it receives |

**Why this is useful:** Build output can be thousands of lines long. The errors you actually care about are almost always at the *end*. Without `2>&1`, errors would print separately and bypass the pipe entirely — you'd miss them.

---------------------------------------------------------------------