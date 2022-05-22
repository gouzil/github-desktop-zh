import * as React from 'react'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Ref } from '../lib/ref'
import { Repository } from '../../models/repository'
import { TrashNameLabel } from '../lib/context-menu'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IConfirmRemoveRepositoryProps {
  /** The repository to be removed */
  readonly repository: Repository

  /** The action to execute when the user confirms */
  readonly onConfirmation: (
    repo: Repository,
    deleteRepoFromDisk: boolean
  ) => Promise<void>

  /** The action to execute when the user cancels */
  readonly onDismissed: () => void
}

interface IConfirmRemoveRepositoryState {
  readonly deleteRepoFromDisk: boolean
  readonly isRemovingRepository: boolean
}

export class ConfirmRemoveRepository extends React.Component<
  IConfirmRemoveRepositoryProps,
  IConfirmRemoveRepositoryState
> {
  public constructor(props: IConfirmRemoveRepositoryProps) {
    super(props)

    this.state = {
      deleteRepoFromDisk: false,
      isRemovingRepository: false,
    }
  }

  private onSubmit = async () => {
    this.setState({ isRemovingRepository: true })

    await this.props.onConfirmation(
      this.props.repository,
      this.state.deleteRepoFromDisk
    )

    this.props.onDismissed()
  }

  public render() {
    const isRemovingRepository = this.state.isRemovingRepository

    return (
      <Dialog
        id="confirm-remove-repository"
        key="remove-repository-confirmation"
        type="warning"
        title={__DARWIN__ ? '删除存储库' : '删除存储库'}
        dismissable={isRemovingRepository ? false : true}
        loading={isRemovingRepository}
        disabled={isRemovingRepository}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
      >
        <DialogContent>
          <p>
            是否确实要删除存储库 "{this.props.repository.name}" 从 GitHub
            Desktop?
          </p>
          <p className="description">
            存储库将从 GitHub Desktop 中删除:
            <br />
            <Ref>{this.props.repository.path}</Ref>
          </p>

          <div>
            <Checkbox
              label={'同时将此存储库移动到 ' + TrashNameLabel}
              value={
                this.state.deleteRepoFromDisk
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onConfirmRepositoryDeletion}
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="去除" />
        </DialogFooter>
      </Dialog>
    )
  }

  private onConfirmRepositoryDeletion = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ deleteRepoFromDisk: value })
  }
}
