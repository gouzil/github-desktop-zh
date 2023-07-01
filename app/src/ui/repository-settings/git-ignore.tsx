import * as React from 'react'
import { DialogContent } from '../dialog'
import { TextArea } from '../lib/text-area'
import { LinkButton } from '../lib/link-button'
import { Ref } from '../lib/ref'

interface IGitIgnoreProps {
  readonly text: string | null
  readonly onIgnoreTextChanged: (text: string) => void
  readonly onShowExamples: () => void
}

/** A view for creating or modifying the repository's gitignore file */
export class GitIgnore extends React.Component<IGitIgnoreProps, {}> {
  public render() {
    return (
      <DialogContent>
        <p>
          编辑 <Ref>.gitignore</Ref>. 该文件指定Git应该忽略的故意未跟踪的文件.
          Git已跟踪的文件不受影响.{' '}
          <LinkButton onClick={this.props.onShowExamples}>
            了解有关gitignore文件的更多信息
          </LinkButton>
        </p>

        <TextArea
          placeholder="(Ignored) 忽略文件"
          value={this.props.text || ''}
          onValueChanged={this.props.onIgnoreTextChanged}
          textareaClassName="gitignore"
        />
      </DialogContent>
    )
  }
}
