import React from 'react'
import { Octicon } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'
import { LinkButton } from '../lib/link-button'

export class HiddenBidiCharsWarning extends React.Component {
  public render() {
    return (
      <div className="hidden-bidi-chars-warning">
        <Octicon symbol={OcticonSymbol.alert} />
        此差异包含双向Unicode文本, 其解释或编译方式可能与下面显示的不同. 要查看,
        请在显示隐藏Unicode字符的编辑器中打开该文件.{' '}
        <LinkButton uri="https://github.co/hiddenchars">
          了解有关双向Unicode字符的详细信息
        </LinkButton>
      </div>
    )
  }
}
