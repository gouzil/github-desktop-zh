import * as React from 'react'
import { Octicon } from '../../octicons'
import * as OcticonSymbol from '../../octicons/octicons.generated'
import { LinkButton } from '../link-button'

export function renderUnmergedFilesSummary(conflictedFilesCount: number) {
  // localization, it burns :vampire:
  const message =
    conflictedFilesCount === 1
      ? `1个冲突文件`
      : `${conflictedFilesCount} 个冲突文件`
  return <h3 className="summary">{message}</h3>
}

export function renderAllResolved() {
  return (
    <div className="all-conflicts-resolved">
      <div className="green-circle">
        <Octicon symbol={OcticonSymbol.check} />
      </div>
      <div className="message">已解决所有冲突</div>
    </div>
  )
}

export function renderShellLink(openThisRepositoryInShell: () => void) {
  return (
    <div>
      <LinkButton onClick={openThisRepositoryInShell}>
        在命令行中打开,
      </LinkButton>{' '}
      您的工具选择，或关闭手动解决.
    </div>
  )
}
