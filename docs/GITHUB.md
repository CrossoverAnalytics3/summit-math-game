# Update GitHub while preserving the earlier game

This source package is a separate iteration. It does not push to GitHub automatically. Keep the earlier release available until you have reviewed the new experience and recorded the matching demo.

## Recommended: review on a new branch

1. Download and extract the new source package into its own folder.
2. Follow the root README to run it locally with Node 24. Read the current verification record and play both routes.
3. In GitHub Desktop, open your existing `CrossoverAnalytics3/summit-math-game` repository and fetch the latest changes. Commit any work you intend to preserve before replacing files.
4. Create a new branch such as `teach-the-climb-v0.5.3`. A branch lets you review the new direction while the earlier default branch stays available.
5. Copy the extracted source files into that checked-out repository. Include hidden project files: `.env.example`, `.gitignore`, `.nvmrc`, and `.github/`. Preserve the repository's `.git` folder. Do not copy `node_modules`, `.env`, local databases, or private notes.
6. Review changed files in GitHub Desktop. Old source files that are no longer used should be deliberately removed; merely overlaying files can leave obsolete pages or scripts behind. The new package retains the intended original activities and an archive in `docs/legacy/`.
7. Run the README verification commands from the resulting repository. A pass in the extracted package is not proof that the combined checkout is correct.
8. Commit with a clear message, for example `Add child-selected practice rules and traceable worksheet evidence`, then publish the branch.
9. Open a pull request. Describe the teaching loop, the two route consequences, the AI boundaries, and the checks actually completed. Review the file list for credentials or child information before merging.
10. Merge only after you are satisfied with the new direction. Use the resulting repository URL for the source-code field. Update any hosted demo and video separately; changing GitHub alone does not redeploy them.

## Submission consistency

The README, live app, and video should all describe the same version. The earlier arithmetic/tower demo does not demonstrate the new teaching and correction flows. Use [DEMO.md](DEMO.md) to prepare the new screen recording after final browser verification.

The source package contains no GitHub credentials. Avoid force-pushes or deleting the earlier repository to publish this iteration.
