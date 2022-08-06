import * as Path from 'path'

import { git } from './core'
import { GitError } from 'dugite'
import { Repository } from '../../models/repository'
import { pathExists } from '../../ui/lib/path-exists'

export enum MergeResult {
  /** The merge completed successfully */
  Success,
  /**
   * The merge was a noop since the current branch
   * was already up to date with the target branch.
   */
  AlreadyUpToDate,
  /**
   * The merge failed, likely due to conflicts.
   */
  Failed,
}

/** Merge the named branch into the current branch. */
export async function merge(
  repository: Repository,
  branch: string,
  isSquash: boolean = false
): Promise<MergeResult> {
  const args = ['merge']

  if (isSquash) {
    args.push('--squash')
  }

  args.push(branch)

  const { exitCode, stdout } = await git(args, repository.path, 'merge', {
    expectedErrors: new Set([GitError.MergeConflicts]),
  })

  if (exitCode !== 0) {
    return MergeResult.Failed
  }

  if (isSquash) {
    const { exitCode } = await git(
      ['commit', '--no-edit'],
      repository.path,
      'createSquashMergeCommit'
    )
    if (exitCode !== 0) {
      return MergeResult.Failed
    }
  }

  return stdout === noopMergeMessage
    ? MergeResult.AlreadyUpToDate
    : MergeResult.Success
}

const noopMergeMessage = 'Already up to date.\n'

/**
 * Find the base commit between two commit-ish identifiers
 *
 * @returns the commit id of the merge base, or null if the two commit-ish
 *          identifiers do not have a common base
 */
export async function getMergeBase(
  repository: Repository,
  firstCommitish: string,
  secondCommitish: string
): Promise<string | null> {
  const process = await git(
    ['merge-base', firstCommitish, secondCommitish],
    repository.path,
    'merge-base',
    {
      // - 1 is returned if a common ancestor cannot be resolved
      // - 128 is returned if a ref cannot be found
      //   "warning: ignoring broken ref refs/remotes/origin/main."
      successExitCodes: new Set([0, 1, 128]),
    }
  )

  if (process.exitCode === 1 || process.exitCode === 128) {
    return null
  }

  return process.stdout.trim()
}

/**
 * Abort a mid-flight (conflicted) merge
 *
 * @param repository where to abort the merge
 */
export async function abortMerge(repository: Repository): Promise<void> {
  await git(['merge', '--abort'], repository.path, 'abortMerge')
}

/**
 * Check the `.git/MERGE_HEAD` file exists in a repository to confirm
 * that it is in a conflicted state.
 */
export async function isMergeHeadSet(repository: Repository): Promise<boolean> {
  const path = Path.join(repository.path, '.git', 'MERGE_HEAD')
  return await pathExists(path)
}

/**
 * Check the `.git/SQUASH_MSG` file exists in a repository
 * This would indicate we did a merge --squash and have not committed.. indicating
 * we have detected a conflict.
 *
 * Note: If we abort the merge, this doesn't get cleared automatically which
 * could lead to this being erroneously available in a non merge --squashing scenario.
 */
export async function isSquashMsgSet(repository: Repository): Promise<boolean> {
  const path = Path.join(repository.path, '.git', 'SQUASH_MSG')
  return await pathExists(path)
}
