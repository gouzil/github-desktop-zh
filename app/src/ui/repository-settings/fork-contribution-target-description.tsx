import * as React from 'react'
import { ForkContributionTarget } from '../../models/workflow-preferences'
import { RepositoryWithForkedGitHubRepository } from '../../models/repository'

interface IForkSettingsDescription {
  readonly repository: RepositoryWithForkedGitHubRepository
  readonly forkContributionTarget: ForkContributionTarget
}

export function ForkSettingsDescription(props: IForkSettingsDescription) {
  // We can't use the getNonForkGitHubRepository() helper since we need to calculate
  // the value based on the temporary form state.
  const targetRepository =
    props.forkContributionTarget === ForkContributionTarget.Self
      ? props.repository.gitHubRepository
      : props.repository.gitHubRepository.parent

  return (
    <ul className="fork-settings-description">
      <li>
        拉取请求目标 <strong>{targetRepository.fullName}</strong>{' '}
        将显示在拉动请求列表中.
      </li>
      <li>
        问题将在 <strong>{targetRepository.fullName}</strong> 中创建.
      </li>
      <li>
        "在 Github 中查看" 将打开 <strong>{targetRepository.fullName}</strong>{' '}
        浏览器.
      </li>
      <li>
        新分支机构将基于{' '}
        <strong>{targetRepository.fullName}</strong> 默认分支.
      </li>
      <li>
        自动完成的用户和问题将基于{' '}
        <strong>{targetRepository.fullName}</strong>.
      </li>
    </ul>
  )
}
