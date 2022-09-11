import { DiffHunk, DiffLine, DiffLineType } from '../../models/diff'
import * as CodeMirror from 'codemirror'
import { diffLineForIndex } from './diff-explorer'
import { ITokens } from '../../lib/highlighter/types'

import 'codemirror/mode/javascript/javascript'
import { DefaultDiffExpansionStep } from './text-diff-expansion'
import { getFirstAndLastClassesUnified } from './diff-helpers'

export interface IDiffSyntaxModeOptions {
  /**
   * The unified diff representing the change
   */
  readonly hunks: ReadonlyArray<DiffHunk>

  /**
   * Tokens returned from the highlighter for the 'before'
   * version of the change
   */
  readonly oldTokens: ITokens

  /**
   * Tokens returned from the highlighter for the 'after'
   * version of the change
   */
  readonly newTokens: ITokens
}

export interface IDiffSyntaxModeSpec extends IDiffSyntaxModeOptions {
  readonly name: 'github-diff-syntax'
}

export enum DiffSyntaxToken {
  Add = 'diff-add',
  Delete = 'diff-delete',
  Hunk = 'diff-hunk',
  Context = 'diff-context',
}

const TokenNames: { [key: string]: DiffSyntaxToken | undefined } = {
  '+': DiffSyntaxToken.Add,
  '-': DiffSyntaxToken.Delete,
  '@': DiffSyntaxToken.Hunk,
  ' ': DiffSyntaxToken.Context,
}

interface IState {
  diffLineIndex: number
  previousHunkOldEndLine: number | null
  prevLineToken: DiffSyntaxToken | undefined
}

function skipLine(stream: CodeMirror.StringStream, state: IState) {
  stream.skipToEnd()
  state.diffLineIndex++
  return null
}

function getBaseDiffLineStyle(
  token: DiffSyntaxToken,
  customBackgroundClassNames: ReadonlyArray<string> = []
) {
  const customBackgroundStyles = customBackgroundClassNames
    .map(c => `line-background-${c}`)
    .join(' ')

  return `line-${token} line-background-${token} ${customBackgroundStyles}`
}

/**
 * Attempt to get tokens for a particular diff line. This will attempt
 * to look up tokens in both the old tokens and the new which is
 * important because for context lines we might only have tokens in
 * one version and we need to be resilient about that.
 */
export function getTokensForDiffLine(
  diffLine: DiffLine,
  oldTokens: ITokens | undefined,
  newTokens: ITokens | undefined
) {
  const oldTokensResult = getTokens(diffLine.oldLineNumber, oldTokens)

  if (oldTokensResult !== null) {
    return oldTokensResult
  }

  return getTokens(diffLine.newLineNumber, newTokens)
}

/**
 * Attempt to get tokens for a particular diff line. This will attempt
 * to look up tokens in both the old tokens and the new which is
 * important because for context lines we might only have tokens in
 * one version and we need to be resilient about that.
 */
export function getTokens(
  lineNumber: number | null,
  tokens: ITokens | undefined
) {
  // Note: Diff lines numbers start at one so we adjust this in order
  // to get the line _index_ in the before or after file contents.
  if (
    tokens !== undefined &&
    lineNumber !== null &&
    tokens[lineNumber - 1] !== undefined
  ) {
    return tokens[lineNumber - 1]
  }

  return null
}

export class DiffSyntaxMode {
  public static readonly ModeName = 'github-diff-syntax'

  private readonly hunks?: ReadonlyArray<DiffHunk>
  private readonly oldTokens?: ITokens
  private readonly newTokens?: ITokens

  public constructor(
    hunks?: ReadonlyArray<DiffHunk>,
    oldTokens?: ITokens,
    newTokens?: ITokens
  ) {
    this.hunks = hunks
    this.oldTokens = oldTokens
    this.newTokens = newTokens
  }

  public startState(): IState {
    return {
      diffLineIndex: 0,
      previousHunkOldEndLine: null,
      prevLineToken: undefined,
    }
  }

  public blankLine(state: IState) {
    // If we run into a blank line and we don't have hunks yet, and given we
    // should never get blank diffs, let's assume we're in the last line of a
    // diff that was just loaded, but for which we haven't run the highlighter
    // yet. If we don't do this, that last line will be formatted wrongly.
    if (this.hunks === undefined) {
      return getBaseDiffLineStyle(DiffSyntaxToken.Hunk)
    }

    // A line might be empty in a non-blank diff for the only line of the
    // dummy hunk we put at the bottom of the diff to allow users to expand
    // the visible contents.
    if (this.hunks.length > 0) {
      const diffLine = diffLineForIndex(this.hunks, state.diffLineIndex)
      if (diffLine?.type === DiffLineType.Hunk) {
        return getBaseDiffLineStyle(DiffSyntaxToken.Hunk)
      }
    }

    // Should never happen except for blank diffs but
    // let's play along
    state.diffLineIndex++
    return undefined
  }

  public token = (
    stream: CodeMirror.StringStream,
    state: IState
  ): string | null => {
    // The first character of a line in a diff is always going to
    // be the diff line marker so we always take care of that first.
    if (stream.sol()) {
      const tokenKey = stream.next()

      if (stream.eol()) {
        state.diffLineIndex++
      }

      if (tokenKey === null) {
        return null
      }

      const token = TokenNames[tokenKey]

      if (token === undefined) {
        return null
      }

      const nextLine = stream.lookAhead(1)
      const nextLineToken =
        typeof nextLine === 'string' ? TokenNames[nextLine[0]] : undefined

      const lineBackgroundClassNames = getFirstAndLastClassesUnified(
        token,
        state.prevLineToken,
        nextLineToken
      )
      state.prevLineToken = token

      let result = getBaseDiffLineStyle(token, lineBackgroundClassNames)

      // If it's a hunk header line, we want to make a few extra checks
      // depending on the distance to the previous hunk.
      if (token === DiffSyntaxToken.Hunk) {
        // First we grab the numbers in the hunk header
        const matches = stream.match(/\@ -(\d+),(\d+) \+\d+,\d+ \@\@/)
        if (matches !== null) {
          const oldStartLine = parseInt(matches[1])
          const oldLineCount = parseInt(matches[2])

          // If there is a hunk above and the distance with this one is bigger
          // than the expansion "step", return an additional class name that
          // will be used to make that line taller to fit the expansion buttons.
          if (
            state.previousHunkOldEndLine !== null &&
            oldStartLine - state.previousHunkOldEndLine >
              DefaultDiffExpansionStep
          ) {
            result += ` line-${token}-expandable-both`
          }

          // Finally we update the state with the index of the last line of the
          // current hunk.
          state.previousHunkOldEndLine = oldStartLine + oldLineCount
        }

        // Check again if we reached the EOL after matching the regex
        if (stream.eol()) {
          state.diffLineIndex++
        }
      }

      return result
    }

    // This happens when the mode is running without tokens, in this
    // case there's really nothing more for us to do than what we've
    // already done above to deal with the diff line marker.
    if (this.hunks == null) {
      return skipLine(stream, state)
    }

    const diffLine = diffLineForIndex(this.hunks, state.diffLineIndex)

    if (!diffLine) {
      return skipLine(stream, state)
    }

    const lineTokens = getTokensForDiffLine(
      diffLine,
      this.oldTokens,
      this.newTokens
    )

    if (!lineTokens) {
      return skipLine(stream, state)
    }

    // -1 because the diff line that we're looking at is always prefixed
    // by +, -, @ or space depending on the type of diff line. Those markers
    // are obviously not present in the before/after version.
    const token = lineTokens[stream.pos - stream.lineStart - 1]

    if (!token) {
      // There's no token at the current position so let's skip ahead
      // until we find one or we hit the end of the line. Note that we
      // don't have to worry about already being at the end of the line
      // as it's a requirement for modes to always advance the stream. In
      // other words, CodeMirror will never give us a stream already at
      // the end of a line.
      do {
        stream.pos++
      } while (!stream.eol() && !lineTokens[stream.pos - stream.lineStart - 1])
    } else {
      stream.pos += token.length
    }

    if (stream.eol()) {
      state.diffLineIndex++
    }

    return token ? token.token : null
  }
}

CodeMirror.defineMode(
  DiffSyntaxMode.ModeName,
  function (
    config: CodeMirror.EditorConfiguration,
    modeOptions?: IDiffSyntaxModeOptions
  ) {
    if (!modeOptions) {
      throw new Error('I needs me some options')
    }

    return new DiffSyntaxMode(
      modeOptions.hunks,
      modeOptions.oldTokens,
      modeOptions.newTokens
    )
  }
)
