# How to create and maintain a patch for an external lib used as a dependency

Create a temporary copy of the library to patch

```bash
pnpm patch
```

You now have access to a similar folder as: `/private/var/folders/yn/k6gkp3pd7fq4dn71mw1yb8qh0000gn/T/5191b8b733d6bbfd169476c53b6a123b` that I'll refer to as `temp_lib`

Open it on vscode

```bash
code "/temp_lib"
```

Do all the changes that you need.
And then run

```
diff -Naur node_modules/.pnpm/coinselect@3.1.13/node_modules/coinselect/ /temp_lib
```

And copy the changes to `patches/coinselect@3.1.13.patch`, just taking the lines with `+/-` preceeded by the ones with `@@`.

You can now your patch with

```bash
pnpm install --force
```

If all is good, `patches/coinselect@3.1.13.patch` can be commited as any other file.

# Why use `diff` manually and not use `pmpm patch-commit temp_lib` ?

For some reason, it seems pnpm 8 doesn't handle well newly created files (and not just modified ones). This should be better in [pnpm 9](https://github.com/pnpm/pnpm/issues/5686#issuecomment-2272406668)
