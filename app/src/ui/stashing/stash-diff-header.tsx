import * as React from 'react'
import { IStashEntry } from '../../models/stash-entry'
import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { PopupType } from '../../models/popup'
import { Octicon } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IStashDiffHeaderProps {
  readonly stashEntry: IStashEntry
  readonly repository: Repository
  readonly dispatcher: Dispatcher
  readonly askForConfirmationOnDiscardStash: boolean
  readonly isWorkingTreeClean: boolean
}

interface IStashDiffHeaderState {
  readonly isRestoring: boolean
  readonly isDiscarding: boolean
}

/**
 * Component to provide the actions that can be performed
 * on a stash while viewing a stash diff
 */
export class StashDiffHeader extends React.Component<
  IStashDiffHeaderProps,
  IStashDiffHeaderState
> {
  public constructor(props: IStashDiffHeaderProps) {
    super(props)

    this.state = {
      isRestoring: false,
      isDiscarding: false,
    }
  }

  public render() {
    const { isWorkingTreeClean } = this.props
    const { isRestoring, isDiscarding } = this.state

    return (
      <div className="header">
        <h3>隐藏的更改</h3>
        <div className="row">
          <OkCancelButtonGroup
            okButtonText="恢复"
            okButtonDisabled={
              isRestoring || !isWorkingTreeClean || isDiscarding
            }
            onOkButtonClick={this.onRestoreClick}
            cancelButtonText="丢弃"
            cancelButtonDisabled={isRestoring || isDiscarding}
            onCancelButtonClick={this.onDiscardClick}
          />
          {this.renderExplanatoryText()}
        </div>
      </div>
    )
  }

  private renderExplanatoryText() {
    const { isWorkingTreeClean } = this.props

    if (isWorkingTreeClean || this.state.isRestoring) {
      return (
        <div className="explanatory-text">
          <span className="text">
            <strong>恢复</strong> 将您隐藏的文件移动到更改列表.
          </span>
        </div>
      )
    }

    return (
      <div className="explanatory-text">
        <Octicon symbol={OcticonSymbol.alert} />
        <span className="text">当分支上存在更改时，无法恢复存储.</span>
      </div>
    )
  }

  private onDiscardClick = async () => {
    const {
      dispatcher,
      repository,
      stashEntry,
      askForConfirmationOnDiscardStash,
    } = this.props

    if (!askForConfirmationOnDiscardStash) {
      this.setState({
        isDiscarding: true,
      })

      try {
        await dispatcher.dropStash(repository, stashEntry)
      } finally {
        this.setState({
          isDiscarding: false,
        })
      }
    } else {
      dispatcher.showPopup({
        type: PopupType.ConfirmDiscardStash,
        stash: stashEntry,
        repository,
      })
    }
  }

  private onRestoreClick = async () => {
    const { dispatcher, repository, stashEntry } = this.props

    this.setState({ isRestoring: true }, () => {
      dispatcher.popStash(repository, stashEntry)
    })
  }
}
