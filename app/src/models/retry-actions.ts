import { Repository } from './repository'
import { CloneOptions } from './clone-options'
import { Branch } from './branch'
import { Commit, CommitOneLine, ICommitContext } from './commit'
import { WorkingDirectoryFileChange } from './status'

/** The types of actions that can be retried. */
export enum RetryActionType {
  Push = 1,
  Pull,
  Fetch,
  Clone,
  Checkout,
  Merge,
  Rebase,
  CherryPick,
  CreateBranchForCherryPick,
  Squash,
  Reorder,
  DiscardChanges,
}

/** The retriable actions and their associated data. */
export type RetryAction =
  | { type: RetryActionType.Push; repository: Repository }
  | { type: RetryActionType.Pull; repository: Repository }
  | { type: RetryActionType.Fetch; repository: Repository }
  | {
      type: RetryActionType.Clone
      name: string
      url: string
      path: string
      options: CloneOptions
    }
  | {
      type: RetryActionType.Checkout
      repository: Repository
      branch: Branch
    }
  | {
      type: RetryActionType.Merge
      repository: Repository
      currentBranch: string
      theirBranch: Branch
    }
  | {
      type: RetryActionType.Rebase
      repository: Repository
      baseBranch: Branch
      targetBranch: Branch
    }
  | {
      type: RetryActionType.CherryPick
      repository: Repository
      targetBranch: Branch
      commits: ReadonlyArray<CommitOneLine>
      sourceBranch: Branch | null
    }
  | {
      type: RetryActionType.CreateBranchForCherryPick
      repository: Repository
      targetBranchName: string
      startPoint: string | null
      noTrackOption: boolean
      commits: ReadonlyArray<CommitOneLine>
      sourceBranch: Branch | null
    }
  | {
      type: RetryActionType.Squash
      repository: Repository
      toSquash: ReadonlyArray<Commit>
      squashOnto: Commit
      lastRetainedCommitRef: string | null
      commitContext: ICommitContext
    }
  | {
      type: RetryActionType.Reorder
      repository: Repository
      commitsToReorder: ReadonlyArray<Commit>
      beforeCommit: Commit | null
      lastRetainedCommitRef: string | null
    }
  | {
      type: RetryActionType.DiscardChanges
      repository: Repository
      files: ReadonlyArray<WorkingDirectoryFileChange>
    }
