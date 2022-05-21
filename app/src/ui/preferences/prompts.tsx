import * as React from 'react'
import { DialogContent } from '../dialog'
import { Checkbox, CheckboxValue } from '../lib/checkbox'

interface IPromptsPreferencesProps {
  readonly confirmRepositoryRemoval: boolean
  readonly confirmDiscardChanges: boolean
  readonly confirmDiscardChangesPermanently: boolean
  readonly confirmForcePush: boolean
  readonly onConfirmDiscardChangesChanged: (checked: boolean) => void
  readonly onConfirmDiscardChangesPermanentlyChanged: (checked: boolean) => void
  readonly onConfirmRepositoryRemovalChanged: (checked: boolean) => void
  readonly onConfirmForcePushChanged: (checked: boolean) => void
}

interface IPromptsPreferencesState {
  readonly confirmRepositoryRemoval: boolean
  readonly confirmDiscardChanges: boolean
  readonly confirmDiscardChangesPermanently: boolean
  readonly confirmForcePush: boolean
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
      confirmForcePush: this.props.confirmForcePush,
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

  private onConfirmForcePushChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmForcePush: value })
    this.props.onConfirmForcePushChanged(value)
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
          label="强制推送"
          value={
            this.state.confirmForcePush ? CheckboxValue.On : CheckboxValue.Off
          }
          onChange={this.onConfirmForcePushChanged}
        />
      </DialogContent>
    )
  }
}
