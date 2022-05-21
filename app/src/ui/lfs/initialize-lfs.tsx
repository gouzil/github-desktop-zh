import * as React from 'react'
import { Repository } from '../../models/repository'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { PathText } from '../lib/path-text'
import { LinkButton } from '../lib/link-button'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

const LFSURL = 'https://git-lfs.github.com/'

/**
 * If we're initializing any more than this number, we won't bother listing them
 * all.
 */
const MaxRepositoriesToList = 10

interface IInitializeLFSProps {
  /** The repositories in which LFS needs to be initialized. */
  readonly repositories: ReadonlyArray<Repository>

  /**
   * Event triggered when the dialog is dismissed by the user in the
   * ways described in the Dialog component's dismissable prop.
   */
  readonly onDismissed: () => void

  /**
   * Called when the user chooses to initialize LFS in the repositories.
   */
  readonly onInitialize: (repositories: ReadonlyArray<Repository>) => void
}

export class InitializeLFS extends React.Component<IInitializeLFSProps, {}> {
  public render() {
    return (
      <Dialog
        id="initialize-lfs"
        title="初始化Git LFS"
        dismissable={false}
        onSubmit={this.onInitialize}
      >
        <DialogContent>{this.renderRepositories()}</DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText="初始化Git LFS"
            cancelButtonText={__DARWIN__ ? '不是现在' : '不是现在'}
            onCancelButtonClick={this.props.onDismissed}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onInitialize = () => {
    this.props.onInitialize(this.props.repositories)
    this.props.onDismissed()
  }

  private renderRepositories() {
    if (this.props.repositories.length > MaxRepositoriesToList) {
      return (
        <p>
          {this.props.repositories.length} 存储库使用{' '}
          <LinkButton uri={LFSURL}>Git LFS</LinkButton>. 要对其作出贡献, 
          必须首先初始化Git LFS。您现在想这样做吗?
        </p>
      )
    } else {
      const plural = this.props.repositories.length !== 1
      const pluralizedRepositories = plural
        ? '存储库使用'
        : '存储库使用'
      const pluralizedUse = plural ? '它们' : '它们'
      return (
        <div>
          <p>
            {pluralizedRepositories}{' '}
            <LinkButton uri={LFSURL}>Git LFS</LinkButton>. 有助于{' '}
            {pluralizedUse}, 必须首先初始化Git LFS。您现在想这样做吗?
          </p>
          <ul>
            {this.props.repositories.map(r => (
              <li key={r.id}>
                <PathText path={r.path} />
              </li>
            ))}
          </ul>
        </div>
      )
    }
  }
}
