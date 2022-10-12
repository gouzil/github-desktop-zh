# Releasing Updates

## Channels

We have three channels to which we can release: `production`, `beta`, and `test`.

- `production` is the channel from which the general public downloads and receives updates. It should be stable and polished.

- `beta` is released more often than `production`. We want to ensure `development` is always in a state where it can be released to users, so it should be used as the source for `beta` releases as an opportunity for additional QA before releasing to `production`.

- `test` is unlike the other two. It does not receive updates. Each test release is locked in time. It's used entirely for providing test releases.

## The Process

### 1. GitHub Access Token

From a clean working directory, set the `GITHUB_ACCESS_TOKEN` environment variable to a valid [Personal Access Token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/)

To check that this environment variable is set in your shell:

**Bash (macOS, Linux or Git Bash)**
```shellsession
$ echo $GITHUB_ACCESS_TOKEN
```

**Command Prompt**
```shellsession
$ echo %GITHUB_ACCESS_TOKEN%
```

**PowerShell**
```shellsession
$ echo $env:GITHUB_ACCESS_TOKEN
```

If you are creating a new Personal Access Token on GitHub:
* make the token memorable - use a description like `Desktop Draft Release and Changelog Generator`
* the `read:org` scope is the **only** required scope for drafting releases

To set this access token as an environment in your shell:

**Bash (macOS, Linux or Git Bash)**
```shellsession
$ export GITHUB_ACCESS_TOKEN={your token here}
```

**Command Prompt**
```shellsession
$ set GITHUB_ACCESS_TOKEN={your token here}
```

**PowerShell**
```shellsession
$ $env:GITHUB_ACCESS_TOKEN="{your token here}"
```

### 2. Switch to the Commit of the Release

You have to switch to the commit that represents the work that will be released to users:

 - for `beta` releases, switch to `development` to ensure the latest changes are published
 - for `production` releases, check out the latest beta tag
    - to find this tag: `git tag | grep 'beta' | sort -r | head -n 1`

### 3. Create Draft Release and Release Branch

Run the script below (which relies on the your personal access token being set), which will determine the next version from what was previously published, based on the desired channel.

For `production` and `beta` releases, run:

```shellsession
$ yarn draft-release (production|beta|test)
```

If you are creating a new beta release, the `yarn draft-release beta` command will help you find the new release entries for the changelog.

If you are create a new `production` release, you should just combine and sort the previous `beta` changelog entries.

The script will output a draft changelog, which covers everything that's been merged, and probably needs some love. It will also create the release branch for you. If that fails for whatever reason and you must create the branch manually, ensure you use the `releases/[version]` pattern for its name to ensure all CI platforms are aware of the branch and will build any PRs that target the branch.

If you have pretext release note drafted in `app/static/common/pretext-draft.md`, you can add the `--pretext` flag to generate a pretext change log entry it. Example: `yarn draft-release test --pretext`

The output will then explain the next steps:
```shellsession
Here's what you should do next:

1. Update the app/package.json 'version' to '1.0.14-beta2' (make sure this aligns with semver format of 'major.minor.patch')
2. Concatenate this to the beginning of the releases element in the changelog.json as a starting point:
{
  "1.0.14-beta2": [
    "[???] Add RubyMine support for macOS - #3883. Thanks @gssbzn!",
    "[???] Allow window to accept single click on focus - #3843",
    "[???] Drop unnecessary comments before issue template - #3906",
    "[???] First-class changelog script for generating release notes - #3888",
    "[???] Fix expanded avatar stack overflow - #3884",
    "[???] Switch to a saner default gravatar size - #3911",
    "[Fixed] Add a repository settings store - #934",
    "[Fixed] Ensure renames are detected when viewing commit diffs - #3673",
    "[Fixed] Line endings are hard, lets go shopping - #3514",
  ]
}
3. Revise the release notes according to https://github.com/desktop/desktop/blob/development/docs/process/writing-release-notes.md
4. Commit the changes (on development or as new branch) and push them to GitHub
5. Read this to perform the release: https://github.com/desktop/desktop/blob/development/docs/process/releasing-updates.md
```

See our [release notes writing guide](./writing-release-notes.md) for more info on how we write and review our release notes.

_Note: You should ensure the `version` in `app/package.json` is set to the new version and follows the [semver format](https://semver.org/) of `major.minor.patch`._

Examples:
* for prod, `1.1.0` -> `1.1.1` or `1.1.13` -> `1.2.0`
* for beta, `1.1.0-beta1` -> `1.1.0-beta2` or `1.1.13-beta3` -> `1.2.0-beta1`
* for test, `1.0.14-test2` -> `1.0.14-test3` or `1.1.14-test3` -> `1.2.0-test1`

Here's an example of the previous changelog draft after it has been edited:

```json
{
  "1.0.14-beta2": [
    "[Added] Add RubyMine support for macOS - #3883. Thanks @gssbzn!",
    "[Fixed] Allow window to accept single click on focus - #3843",
    "[Fixed] Expanded avatar list hidden behind commit details - #3884",
    "[Fixed] Renames not detected when viewing commit diffs - #3673",
    "[Fixed] Ignore action assumes CRLF when core.autocrlf is unset - #3514",
    "[Improved] Use smaller default size when rendering Gravatar avatars - #3911",
  ]
}
```

Add your new changelog entries to `changelog.json`, update the version in `app/package.json`, commit the changes, and push this branch to GitHub. This becomes the release branch, and lets other maintainers continue to merge into `development` without affecting your release.

If a maintainer would like to backport a pull request to the next release, it is their responsibility to co-ordinate with the release owner and ensure they are fine with accepting this work.

After pushing the branch, a [GitHub Action](https://github.com/desktop/desktop/blob/development/.github/workflows/release-pr.yml) will create a release Pull Request for it. If that action fails for whatever reason, you can fall back to using the `yarn draft-release:pr` command, or create it manually.

Once your release branch is ready to review and ship, ask the other maintainers to review and approve the changes!

IMPORTANT NOTE: Do NOT "Update branch" and merge development into the release branch. This might be tempting if the "branch is out-of-date with the base branch" dotcom feature is enabled. However, doing so would inadvertently release everything on development to production or beta 🙀

### 4. Releasing

When you are ready to start the deployment, run this command in chat (where `X.Y.Z-release` is the name of your release branch):

```
.release! desktop/X.Y.Z-release to {production|beta|test}
```

We're using `.release` with a bang so that we don't have to wait for any current CI on the branch to finish. This might feel a little wrong, but it's OK since making the release itself will also run CI.

If you're releasing a `production` update, release a `beta` update for the next version too, so that beta users are on the latest release. For example, if the version just released to production is `1.2.0` then the beta release should be `1.2.1-beta0` to indicate there are no new changes on top of what's currently on `production`.

IMPORTANT NOTE: Ensure that you indicate which channel to release to. If not, chatops will default to releasing to production 🙀

### 5. Check for Completed Release

Go to [Central's Deployments](https://central.githubapp.com/deployments) to find your release; you'll see something at the top of the page like:
```
desktop/desktop deployed from {YOUR_BRANCH}@{HASH_ABBREVIATION_FOR_COMMIT} to {production|beta|test}
```
it will initially specify its state as `State: pending` and will be completed when it says `State: released`

You will also see this in Chat:
`desktopbot tagged desktop/release-{YOUR_VERSION}`

### 6. Enable the Release

Production releases are disabled by default. To enable them, go to [Central's Release Control](https://central.githubapp.com/release_control), select the percentage of users that will be able to auto-update to this new version, and then click the "Apply" button.

### 7. Test that your app auto-updates to new version

When the release in Central is in `State: released` for `beta` or `production`, switch to your installed Desktop instance and make sure that the corresponding (prod|beta) app auto-updates.

Testing that an update is detected, downloaded, and applied correctly is very important - if this is somehow broken during development then our users will not likely stay up to date!

If you don't have the app for `beta`, for example, you can always download the previous version on Central to see it update

_Make sure you move your application out of the Downloads folder and into the Applications folder for macOS or it won't auto-update_.

### 8. Merge PR with changelog entries

So that we keep the `changelog.json` up to date. Beta entries will be used for the upcoming production release.

### 9. Check Error Reporting

If an error occurs during the release process, a needle will be reported to Central's [Haystack](https://haystack.githubapp.com/central).

After the release is deployed, you should monitor Desktop's [Haystack](https://haystack.githubapp.com/desktop) closely for 15 minutes to ensure no unexpected needles appear.

#### Final Beta release
If the active beta is the last beta prior to a production release, extra care should be taken when looking at Desktop's [Haystack](https://haystack.githubapp.com/desktop) roll-ups. The lead engineer responsible for deployment should produce a _Haystack report_ the day before and after the release. The report should contain a list of any new or unexpected errors from the past beta releases in the milestone and be published to the team's Slack channel.

### 10. Celebrate

Once your app updates and you see the visible changes in your app and there are no spikes in errors, celebrate 🎉!!! You did it!

Also it might make sense to continue to monitor Haystack in the background for the next 24 hours.

## Retrying a Failed Release

Sometimes deployments will fail for any reason: one of the CI jobs times out, uploading the builds fails…

When that happens, we should never just re-run the CI jobs, because that could cause problems with the updates of the Windows app.

Instead, we have two options:
1. Delete the failed release from Central (and its `release-${version}-${channel}` tag, if it exists), and then create a new release from the same branch as usual.
2. Just create a new version (bumping the version number) and release it instead.

## Stopping a Release Mid-flight

So let's say you kicked off a release with chatops on accident. Here's how you fix that.

When you kicked off the release, a branch with the prefix `__release-${channel}-` was created in the GitHub repo. Use that branch name to find the proper CI jobs below.

1. Delete the pending release from Central
2. Cancel the GitHub Action release job
3. Delete the CI release job branch from GitHub
4. Breathe a sigh of relief

You don't need to do anything with your manually created release branch, that you referred to in the chatops command. Feel free to re-use it.
