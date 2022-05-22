import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Repository } from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { Row } from '../lib/row'
import { IStashEntry } from '../../models/stash-entry'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IConfirmDiscardStashProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly stash: IStashEntry
  readonly onDismissed: () => void
}

interface IConfirmDiscardStashState {
  readonly isDiscarding: boolean
}
/**
 * Dialog to confirm dropping a stash
 */
export class ConfirmDiscardStashDialog extends React.Component<
  IConfirmDiscardStashProps,
  IConfirmDiscardStashState
> {
  public constructor(props: IConfirmDiscardStashProps) {
    super(props)

    this.state = {
      isDiscarding: false,
    }
  }

  public render() {
    const title = __DARWIN__ ? '丢弃隐藏?' : '丢弃隐藏?'

    return (
      <Dialog
        id="discard-stash"
        type="warning"
        title={title}
        loading={this.state.isDiscarding}
        disabled={this.state.isDiscarding}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <Row>是否确实要放弃这些隐藏的更改?</Row>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="丢弃" />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSubmit = async () => {
    const { dispatcher, repository, stash, onDismissed } = this.props

    this.setState({
      isDiscarding: true,
    })

    try {
      await dispatcher.dropStash(repository, stash)
    } finally {
      this.setState({
        isDiscarding: false,
      })
    }

    onDismissed()
  }
}
