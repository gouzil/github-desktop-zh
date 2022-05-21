import * as React from 'react'

import { DialogFooter, DialogContent, Dialog } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IConfirmExitTutorialProps {
  readonly onDismissed: () => void
  readonly onContinue: () => boolean
}

export class ConfirmExitTutorial extends React.Component<
  IConfirmExitTutorialProps,
  {}
> {
  public render() {
    return (
      <Dialog
        title={__DARWIN__ ? '退出教程' : '退出教程'}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onContinue}
        type="normal"
      >
        <DialogContent>
          <p>
            是否确实要退出教程? 这将使您返回主屏幕.
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={__DARWIN__ ? '退出教程' : '退出教程'}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onContinue = () => {
    const dismissPopup = this.props.onContinue()

    if (dismissPopup) {
      this.props.onDismissed()
    }
  }
}
