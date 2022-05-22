import * as React from 'react'

import { Dispatcher } from '../dispatcher'
import { nameOf, Repository } from '../../models/repository'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { TextBox } from '../lib/text-box'

interface IChangeRepositoryAliasProps {
  readonly dispatcher: Dispatcher
  readonly onDismissed: () => void
  readonly repository: Repository
}

interface IChangeRepositoryAliasState {
  readonly newAlias: string
}

export class ChangeRepositoryAlias extends React.Component<
  IChangeRepositoryAliasProps,
  IChangeRepositoryAliasState
> {
  public constructor(props: IChangeRepositoryAliasProps) {
    super(props)

    this.state = { newAlias: props.repository.alias ?? props.repository.name }
  }

  public render() {
    const repository = this.props.repository
    const verb = repository.alias === null ? '创建' : '改变'

    return (
      <Dialog
        id="change-repository-alias"
        title={__DARWIN__ ? `${verb} 存储库别名` : `${verb} 存储库别名`}
        onDismissed={this.props.onDismissed}
        onSubmit={this.changeAlias}
      >
        <DialogContent>
          <p>为存储库选择新别名 "{nameOf(repository)}". </p>
          <p>
            <TextBox
              value={this.state.newAlias}
              onValueChanged={this.onNameChanged}
            />
          </p>
          {repository.gitHubRepository !== null && (
            <p className="description">这不会影响GitHub上的原始存储库名称.</p>
          )}
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={__DARWIN__ ? `${verb} 别名` : `${verb} 别名`}
            okButtonDisabled={this.state.newAlias.length === 0}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onNameChanged = (newAlias: string) => {
    this.setState({ newAlias })
  }

  private changeAlias = () => {
    this.props.dispatcher.changeRepositoryAlias(
      this.props.repository,
      this.state.newAlias
    )
    this.props.onDismissed()
  }
}
