import * as React from 'react'
import { DialogContent } from '../dialog'
import { ForkContributionTarget } from '../../models/workflow-preferences'
import { RepositoryWithForkedGitHubRepository } from '../../models/repository'
import { ForkSettingsDescription } from './fork-contribution-target-description'
import { RadioButton } from '../lib/radio-button'

interface IForkSettingsProps {
  readonly forkContributionTarget: ForkContributionTarget
  readonly repository: RepositoryWithForkedGitHubRepository
  readonly onForkContributionTargetChanged: (
    forkContributionTarget: ForkContributionTarget
  ) => void
}

/** A view for creating or modifying the repository's gitignore file */
export class ForkSettings extends React.Component<IForkSettingsProps, {}> {
  public render() {
    return (
      <DialogContent>
        <h2>我将使用这个分支…</h2>

        <RadioButton
          value={ForkContributionTarget.Parent}
          checked={
            this.props.forkContributionTarget === ForkContributionTarget.Parent
          }
          label="贡献给父存储库"
          onSelected={this.onForkContributionTargetChanged}
        />

        <RadioButton
          value={ForkContributionTarget.Self}
          checked={
            this.props.forkContributionTarget === ForkContributionTarget.Self
          }
          label="为了我自己的目的"
          onSelected={this.onForkContributionTargetChanged}
        />

        <ForkSettingsDescription
          repository={this.props.repository}
          forkContributionTarget={this.props.forkContributionTarget}
        />
      </DialogContent>
    )
  }

  private onForkContributionTargetChanged = (value: ForkContributionTarget) => {
    this.props.onForkContributionTargetChanged(value)
  }
}
