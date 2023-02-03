import { getCommitsBetweenCommits, getMergeBase } from '../../lib/git'
import { promiseWithMinimumTimeout } from '../../lib/promise'
import { Branch } from '../../models/branch'
import { ComputedAction } from '../../models/computed-action'
import { MultiCommitOperationKind } from '../../models/multi-commit-operation'
import { RebasePreview } from '../../models/rebase'
import { Repository } from '../../models/repository'
import { IDropdownSelectButtonOption } from '../dropdown-select-button'

export function getMergeOptions(): ReadonlyArray<
  IDropdownSelectButtonOption<MultiCommitOperationKind>
> {
  return [
    {
      label: '创建合并提交',
      description: '来自所选分支的提交将通过合并提交添加到当前分支.',
      value: MultiCommitOperationKind.Merge,
    },
    {
      label: 'Squash and merge',
      description: '所选分支中的提交将合并为当前分支中的一个提交.',
      value: MultiCommitOperationKind.Squash,
    },
    {
      label: '变基',
      description: '来自所选分支的提交将被重新基于并添加到当前分支.',
      value: MultiCommitOperationKind.Rebase,
    },
  ]
}

export async function updateRebasePreview(
  baseBranch: Branch,
  targetBranch: Branch,
  repository: Repository,
  onUpdate: (rebasePreview: RebasePreview | null) => void
) {
  const computingRebaseForBranch = baseBranch.name

  onUpdate({
    kind: ComputedAction.Loading,
  })

  const { commits, base } = await promiseWithMinimumTimeout(async () => {
    const commits = await getCommitsBetweenCommits(
      repository,
      baseBranch.tip.sha,
      targetBranch.tip.sha
    )

    const base = await getMergeBase(
      repository,
      baseBranch.tip.sha,
      targetBranch.tip.sha
    )

    return { commits, base }
  }, 500)

  // if the branch being track has changed since we started this work, abandon
  // any further state updates (this function is re-entrant if the user is
  // using the keyboard to quickly switch branches)
  if (computingRebaseForBranch !== baseBranch.name) {
    onUpdate(null)
    return
  }

  // if we are unable to find any commits to rebase, indicate that we're
  // unable to proceed with the rebase
  if (commits === null) {
    onUpdate({
      kind: ComputedAction.Invalid,
    })
    return
  }

  // the target branch is a direct descendant of the base branch
  // which means the target branch is already up to date and the commits
  // do not need to be applied
  const isDirectDescendant = base === baseBranch.tip.sha
  const commitsOrIgnore = isDirectDescendant ? [] : commits

  onUpdate({
    kind: ComputedAction.Clean,
    commits: commitsOrIgnore,
  })
}
