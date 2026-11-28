# Publishing a release

The archived `v0.*` tags are local backups. Never use `git push --tags`, `--follow-tags`, or `--mirror` for a release. Use `--no-follow-tags` even when pushing a single ref: a maintainer may have `push.followTags=true` in their Git configuration.

1. From the publishing checkout on `main`, confirm that `HEAD` is the committed release you validated, the working tree is clean, and the manifest points to the new version's ZIP. Run this PowerShell preflight and preview:

   ```powershell
   $tag = 'v' + (Get-Content -Raw -LiteralPath module.json | ConvertFrom-Json).version
   if ($tag -notmatch '^v[1-9][0-9]*\.[0-9]+\.[0-9]+$') { throw "Not a stable release tag: $tag" }
   $ref = "refs/tags/$tag"
   git ls-remote --refs --tags origin
   if ($LASTEXITCODE -ne 0) { throw 'Could not list public tags' }
   git ls-remote --exit-code --refs origin $ref
   if ($LASTEXITCODE -ne 2) { throw 'Tag already published or remote lookup failed; stop here' }
   git tag -a $tag -m "FF D20 Expanded Bestiary $tag" HEAD
   if ($LASTEXITCODE -ne 0) { throw 'Tag not created; do not force or replace an existing tag' }
   git push --dry-run --no-follow-tags origin "${ref}:$ref"
   if ($LASTEXITCODE -ne 0) { throw 'Tag push preview failed' }
   ```

2. Continue only if the preview shows **one new tag**, named exactly `$tag`, and no branch updates. Push that refspec:

   ```powershell
   git push --no-follow-tags origin "${ref}:$ref"
   if ($LASTEXITCODE -ne 0) { throw 'Tag push failed' }
   ```

3. Create the GitHub release for that tag with `gh release create` and `--verify-tag`. Upload the validated ZIP and `module.json`, verify their hashes, and publish the release **before** moving Foundry's `main` update manifest.
4. Push only the branch, then check the public tags again:

   ```powershell
   git push --no-follow-tags origin refs/heads/main:refs/heads/main
   if ($LASTEXITCODE -ne 0) { throw 'Main push failed' }
   git ls-remote --refs --tags origin
   ```

   Compared with step 1, the only addition should be the new tag; all previous public tags and their object IDs should be unchanged. Verify the public Foundry manifest reports the new version and its ZIP downloads.
