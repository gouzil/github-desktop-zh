import * as React from 'react'
import { Branch, BranchType } from '../../models/branch'

import { Row } from './row'
import { Octicon } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'
import { Ref } from './ref'
import { IStashEntry } from '../../models/stash-entry'

export function renderBranchHasRemoteWarning(branch: Branch) {
  if (branch.upstream != null) {
    return (
      <Row className="warning-helper-text">
        <Octicon symbol={OcticonSymbol.alert} />
        <p>
          此分支正在跟踪 <Ref>{branch.upstream}</Ref> 重命名此分支不会更改远程上的分支名称.
        </p>
      </Row>
    )
  } else {
    return null
  }
}

export function renderBranchNameExistsOnRemoteWarning(
  sanitizedName: string,
  branches: ReadonlyArray<Branch>
) {
  const alreadyExistsOnRemote =
    branches.findIndex(
      b => b.nameWithoutRemote === sanitizedName && b.type === BranchType.Remote
    ) > -1

  if (alreadyExistsOnRemote === false) {
    return null
  }

  return (
    <Row className="warning-helper-text">
      <Octicon symbol={OcticonSymbol.alert} />
      <p>
        一个分支命名 <Ref>{sanitizedName}</Ref> 已在远程上存在.
      </p>
    </Row>
  )
}

export function renderStashWillBeLostWarning(stash: IStashEntry | null) {
  if (stash === null) {
    return null
  }
  return (
    <Row className="warning-helper-text">
      <Octicon symbol={OcticonSymbol.alert} />
      <p>
        如果该分支被重命名, 你当前在该分支上隐藏的更改将不再在GitHub Desktop中可见.
      </p>
    </Row>
  )
}
