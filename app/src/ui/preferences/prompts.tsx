import * as React from 'react'
import { DialogContent } from '../dialog'
import { Checkbox, CheckboxValue } from '../lib/checkbox'

interface IPromptsPreferencesProps {
  readonly confirmRepositoryRemoval: boolean
  readonly confirmDiscardChanges: boolean
  readonly confirmDiscardChangesPermanently: boolean
  readonly confirmDiscardStash: boolean
  readonly confirmForcePush: boolean
  readonly confirmUndoCommit: boolean
  readonly onConfirmDiscardChangesChanged: (checked: boolean) => void
  readonly onConfirmDiscardChangesPermanentlyChanged: (checked: boolean) => void
  readonly onConfirmDiscardStashChanged: (checked: boolean) => void
  readonly onConfirmRepositoryRemovalChanged: (checked: boolean) => void
  readonly onConfirmForcePushChanged: (checked: boolean) => void
  readonly onConfirmUndoCommitChanged: (checked: boolean) => void
}

interface IPromptsPreferencesState {
  readonly confirmRepositoryRemoval: boolean
  readonly confirmDiscardChanges: boolean
  readonly confirmDiscardChangesPermanently: boolean
  readonly confirmDiscardStash: boolean
  readonly confirmForcePush: boolean
  readonly confirmUndoCommit: boolean
}

export class Prompts extends React.Component<
  IPromptsPreferencesProps,
  IPromptsPreferencesState
> {
  public constructor(props: IPromptsPreferencesProps) {
    super(props)

    this.state = {
      confirmRepositoryRemoval: this.props.confirmRepositoryRemoval,
      confirmDiscardChanges: this.props.confirmDiscardChanges,
      confirmDiscardChangesPermanently:
        this.props.confirmDiscardChangesPermanently,
      confirmDiscardStash: this.props.confirmDiscardStash,
      confirmForcePush: this.props.confirmForcePush,
      confirmUndoCommit: this.props.confirmUndoCommit,
    }
  }

  private onConfirmDiscardChangesChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmDiscardChanges: value })
    this.props.onConfirmDiscardChangesChanged(value)
  }

  private onConfirmDiscardChangesPermanentlyChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmDiscardChangesPermanently: value })
    this.props.onConfirmDiscardChangesPermanentlyChanged(value)
  }

  private onConfirmDiscardStashChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmDiscardStash: value })
    this.props.onConfirmDiscardStashChanged(value)
  }

  private onConfirmForcePushChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmForcePush: value })
    this.props.onConfirmForcePushChanged(value)
  }

  private onConfirmUndoCommitChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmUndoCommit: value })
    this.props.onConfirmUndoCommitChanged(value)
  }

  private onConfirmRepositoryRemovalChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmRepositoryRemoval: value })
    this.props.onConfirmRepositoryRemovalChanged(value)
  }

  public render() {
    return (
      <DialogContent>
        <h2>在前面显示一个确认对话框...</h2>
        <Checkbox
          label="删除存储库"
          value={
            this.state.confirmRepositoryRemoval
              ? CheckboxValue.On
              : CheckboxValue.Off
          }
          onChange={this.onConfirmRepositoryRemovalChanged}
        />
        <Checkbox
          label="放弃更改"
          value={
            this.state.confirmDiscardChanges
              ? CheckboxValue.On
              : CheckboxValue.Off
          }
          onChange={this.onConfirmDiscardChangesChanged}
        />
        <Checkbox
          label="永久放弃更改"
          value={
            this.state.confirmDiscardChangesPermanently
              ? CheckboxValue.On
              : CheckboxValue.Off
          }
          onChange={this.onConfirmDiscardChangesPermanentlyChanged}
        />
        <Checkbox
          label="丢弃暂存"
          value={
            this.state.confirmDiscardStash
              ? CheckboxValue.On
              : CheckboxValue.Off
          }
          onChange={this.onConfirmDiscardStashChanged}
        />
        <Checkbox
          label="强制推送"
          value={
            this.state.confirmForcePush ? CheckboxValue.On : CheckboxValue.Off
          }
          onChange={this.onConfirmForcePushChanged}
        />
        <Checkbox
          label="撤消提交"
          value={
            this.state.confirmUndoCommit ? CheckboxValue.On : CheckboxValue.Off
          }
          onChange={this.onConfirmUndoCommitChanged}
        />
      </DialogContent>
    )
  }
}
