import * as React from 'react'
import { Ref } from './ref'
import { LinkButton } from './link-button'
import { unlink } from 'fs/promises'

interface IConfigLockFileExistsProps {
  /**
   * The path to the lock file that's preventing a configuration
   * file update.
   */
  readonly lockFilePath: string

  /**
   * Called when the lock file has been deleted and the configuration
   * update can be retried
   */
  readonly onLockFileDeleted: () => void

  /**
   * Called if the lock file couldn't be deleted
   */
  readonly onError: (e: Error) => void
}

export class ConfigLockFileExists extends React.Component<IConfigLockFileExistsProps> {
  private onDeleteLockFile = async () => {
    try {
      await unlink(this.props.lockFilePath)
    } catch (e) {
      // We don't care about failure to unlink due to the
      // lock file not existing any more
      if (e.code !== 'ENOENT') {
        this.props.onError(e)
        return
      }
    }

    this.props.onLockFileDeleted()
  }
  public render() {
    return (
      <div className="config-lock-file-exists-component">
        <p>
          日志含义更新Git配置文件失败。已存在一个锁文件{' '}
          <Ref>{this.props.lockFilePath}</Ref>.
        </p>
        <p>
          如果另一个工具当前正在修改Git配置,
          或者Git进程提前终止而没有清理锁文件, 则可能会发生这种情况。您是否想要{' '}
          <LinkButton onClick={this.onDeleteLockFile}>删除锁定文件</LinkButton>{' '}
          重试?
        </p>
      </div>
    )
  }
}
