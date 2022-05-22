import { assertNever } from '../lib/fatal-error'
import { WorkingDirectoryFileChange, AppFileStatusKind } from '../models/status'
import {
  DiffLineType,
  ITextDiff,
  DiffSelection,
  ILargeTextDiff,
} from '../models/diff'

/**
 * Generates a string matching the format of a GNU unified diff header excluding
 * the (optional) timestamp fields
 *
 * Note that this multi-line string includes a trailing newline.
 *
 * @param from  The relative path to the original version of the file or
 *              null if the file is newly created.
 *
 * @param to    The relative path to the new version of the file or
 *              null if the file is the file is newly created.
 */
function formatPatchHeader(from: string | null, to: string | null): string {
  // https://en.wikipedia.org/wiki/Diff_utility
  //
  // > At the beginning of the patch is the file information, including the full
  // > path and a time stamp delimited by a tab character.
  // >
  // > [...] the original file is preceded by "---" and the new file is preceded
  // > by "+++".
  //
  // We skip the time stamp to match git
  const fromPath = from ? `a/${from}` : '/dev/null'
  const toPath = to ? `b/${to}` : '/dev/null'

  return `--- ${fromPath}\n+++ ${toPath}\n`
}

/**
 * Generates a string matching the format of a GNU unified diff header excluding
 * the (optional) timestamp fields with the appropriate from/to file names based
 * on the file state of the given WorkingDirectoryFileChange
 */
function formatPatchHeaderForFile(file: WorkingDirectoryFileChange) {
  switch (file.status.kind) {
    case AppFileStatusKind.New:
    case AppFileStatusKind.Untracked:
      return formatPatchHeader(null, file.path)

    // One might initially believe that renamed files should diff
    // against their old path. This is, after all, how git diff
    // does it right after a rename. But if we're creating a patch
    // to be applied along with a rename we must target the renamed
    // file.
    case AppFileStatusKind.Renamed:
    case AppFileStatusKind.Deleted:
    case AppFileStatusKind.Modified:
    case AppFileStatusKind.Copied:
    // We should not have the ability to format a file that's marked as
    // conflicted without more information about it's current state.
    // I'd like to get to a point where `WorkingDirectoryFileChange` can be
    // differentiated between ordinary, renamed/copied and unmerged entries
    // and we can then verify the conflicted file is in a known good state but
    // that work needs to be done waaaaaaaay before we get to this point.
    case AppFileStatusKind.Conflicted:
      return formatPatchHeader(file.path, file.path)
    default:
      return assertNever(file.status, `Unknown file status ${file.status}`)
  }
}

/**
 * Generates a string matching the format of a GNU unified diff hunk header.
 * Note that this single line string includes a single trailing newline.
 *
 * @param oldStartLine The line in the old (or original) file where this diff
 *                     hunk starts.
 *
 * @param oldLineCount The number of lines in the old (or original) file that
 *                     this diff hunk covers.
 *
 * @param newStartLine The line in the new file where this diff hunk starts
 *
 * @param newLineCount The number of lines in the new file that this diff hunk
 *                     covers
 */
function formatHunkHeader(
  oldStartLine: number,
  oldLineCount: number,
  newStartLine: number,
  newLineCount: number,
  sectionHeading?: string | null
) {
  // > @@ -l,s +l,s @@ optional section heading
  // >
  // > The hunk range information contains two hunk ranges. The range for the hunk of the original
  // > file is preceded by a minus symbol, and the range for the new file is preceded by a plus
  // > symbol. Each hunk range is of the format l,s where l is the starting line number and s is
  // > the number of lines the change hunk applies to for each respective file.
  // >
  // > In many versions of GNU diff, each range can omit the comma and trailing value s,
  // > in which case s defaults to 1
  const lineInfoBefore =
    oldLineCount === 1 ? `${oldStartLine}` : `${oldStartLine},${oldLineCount}`

  const lineInfoAfter =
    newLineCount === 1 ? `${newStartLine}` : `${newStartLine},${newLineCount}`

  sectionHeading = sectionHeading ? ` ${sectionHeading}` : ''

  return `@@ -${lineInfoBefore} +${lineInfoAfter} @@${sectionHeading}\n`
}

/**
 * Creates a GNU unified diff based on the original diff and a number
 * of selected or unselected lines (from file.selection). The patch is
 * formatted with the intention of being used for applying against an index
 * with git apply.
 *
 * Note that the file must have at least one selected addition or deletion,
 * ie it's not supported to use this method as a general purpose diff
 * formatter.
 *
 * @param file  The file that the resulting patch will be applied to.
 *              This is used to determine the from and to paths for the
 *              patch header as well as retrieving the line selection state
 *
 * @param diff  The source diff
 */
export function formatPatch(
  file: WorkingDirectoryFileChange,
  diff: ITextDiff | ILargeTextDiff
): string {
  let patch = ''

  diff.hunks.forEach((hunk, hunkIndex) => {
    let hunkBuf = ''

    let oldCount = 0
    let newCount = 0

    let anyAdditionsOrDeletions = false

    hunk.lines.forEach((line, lineIndex) => {
      const absoluteIndex = hunk.unifiedDiffStart + lineIndex

      // We write our own hunk headers
      if (line.type === DiffLineType.Hunk) {
        return
      }

      // Context lines can always be let through, they will
      // never appear for new files.
      if (line.type === DiffLineType.Context) {
        hunkBuf += `${line.text}\n`
        oldCount++
        newCount++
      } else if (file.selection.isSelected(absoluteIndex)) {
        // A line selected for inclusion.

        // Use the line as-is
        hunkBuf += `${line.text}\n`

        if (line.type === DiffLineType.Add) {
          newCount++
        }
        if (line.type === DiffLineType.Delete) {
          oldCount++
        }

        anyAdditionsOrDeletions = true
      } else {
        // Unselected lines in new files needs to be ignored. A new file by
        // definition only consists of additions and therefore so will the
        // partial patch. If the user has elected not to commit a particular
        // addition we need to generate a patch that pretends that the line
        // never existed.
        if (
          file.status.kind === AppFileStatusKind.New ||
          file.status.kind === AppFileStatusKind.Untracked
        ) {
          return
        }

        // An unselected added line has no impact on this patch, pretend
        // it was never added to the old file by dropping it.
        if (line.type === DiffLineType.Add) {
          return
        }

        // An unselected deleted line has never happened as far as this patch
        // is concerned which means that we should treat it as if it's still
        // in the old file so we'll convert it to a context line.
        if (line.type === DiffLineType.Delete) {
          hunkBuf += ` ${line.text.substring(1)}\n`
          oldCount++
          newCount++
        } else {
          // Guarantee that we've covered all the line types
          assertNever(line.type, `Unsupported line type ${line.type}`)
        }
      }

      if (line.noTrailingNewLine) {
        hunkBuf += '\\ No newline at end of file\n'
      }
    })

    // Skip writing this hunk if all there is is context lines.
    if (!anyAdditionsOrDeletions) {
      return
    }

    patch += formatHunkHeader(
      hunk.header.oldStartLine,
      oldCount,
      hunk.header.newStartLine,
      newCount
    )
    patch += hunkBuf
  })

  // If we get into this state we should never have been called in the first
  // place. Someone gave us a faulty diff and/or faulty selection state.
  if (!patch.length) {
    log.debug(`formatPatch: empty path for ${file.path}`)
    throw new Error(`Could not generate a patch, no changes`)
  }

  patch = formatPatchHeaderForFile(file) + patch

  return patch
}

/**
 * Creates a GNU unified diff to discard a set of changes (determined by the selection object)
 * based on the passed diff and a number of selected or unselected lines.
 *
 * The patch is formatted with the intention of being used for applying against an index
 * with git apply.
 *
 * Note that the diff must have at least one selected addition or deletion.
 *
 * This method is the opposite of formatPatch(). TODO: share logic between the two methods.
 *
 * @param filePath    The path of the file that the resulting patch will be applied to.
 *                    This is used to determine the from and to paths for the
 *                    patch header.
 * @param diff        All the local changes for that file.
 * @param selection  A selection of lines from the diff object that we want to discard.
 */
export function formatPatchToDiscardChanges(
  filePath: string,
  diff: ITextDiff,
  selection: DiffSelection
): string | null {
  let patch = ''

  diff.hunks.forEach((hunk, hunkIndex) => {
    let hunkBuf = ''

    let oldCount = 0
    let newCount = 0

    let anyAdditionsOrDeletions = false

    hunk.lines.forEach((line, lineIndex) => {
      const absoluteIndex = hunk.unifiedDiffStart + lineIndex

      // We write our own hunk headers
      if (line.type === DiffLineType.Hunk) {
        return
      }

      // Context lines can always be let through, they will
      // never appear for new files.
      if (line.type === DiffLineType.Context) {
        hunkBuf += `${line.text}\n`
        oldCount++
        newCount++
      } else if (selection.isSelected(absoluteIndex)) {
        // Reverse the change (if it was an added line, treat it as removed and vice versa).
        if (line.type === DiffLineType.Add) {
          hunkBuf += `-${line.text.substring(1)}\n`
          newCount++
        } else if (line.type === DiffLineType.Delete) {
          hunkBuf += `+${line.text.substring(1)}\n`
          oldCount++
        } else {
          assertNever(line.type, `Unsupported line type ${line.type}`)
        }

        anyAdditionsOrDeletions = true
      } else {
        if (line.type === DiffLineType.Add) {
          // An unselected added line will stay in the file after discarding the changes,
          // so we just print it untouched on the diff.
          oldCount++
          newCount++
          hunkBuf += ` ${line.text.substring(1)}\n`
        } else if (line.type === DiffLineType.Delete) {
          // An unselected removed line has no impact on this patch since it's not
          // found on the current working copy of the file, so we can ignore it.
          return
        } else {
          // Guarantee that we've covered all the line types.
          assertNever(line.type, `Unsupported line type ${line.type}`)
        }
      }

      if (line.noTrailingNewLine) {
        hunkBuf += '\\ No newline at end of file\n'
      }
    })

    // Skip writing this hunk if all there is is context lines.
    if (!anyAdditionsOrDeletions) {
      return
    }

    patch += formatHunkHeader(
      hunk.header.newStartLine,
      newCount,
      hunk.header.oldStartLine,
      oldCount
    )
    patch += hunkBuf
  })

  if (patch.length === 0) {
    // The selection resulted in an empty patch.
    return null
  }

  return formatPatchHeader(filePath, filePath) + patch
}
