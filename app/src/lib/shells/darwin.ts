import { spawn, ChildProcess } from 'child_process'
import { assertNever } from '../fatal-error'
import { IFoundShell } from './found-shell'
import appPath from 'app-path'
import { parseEnumValue } from '../enum'

export enum Shell {
  Terminal = 'Terminal',
  Hyper = 'Hyper',
  iTerm2 = 'iTerm2',
  PowerShellCore = 'PowerShell Core',
  Kitty = 'Kitty',
  Alacritty = 'Alacritty',
  WezTerm = 'WezTerm',
}

export const Default = Shell.Terminal

export function parse(label: string): Shell {
  return parseEnumValue(Shell, label) ?? Default
}

function getBundleID(shell: Shell): string {
  switch (shell) {
    case Shell.Terminal:
      return 'com.apple.Terminal'
    case Shell.iTerm2:
      return 'com.googlecode.iterm2'
    case Shell.Hyper:
      return 'co.zeit.hyper'
    case Shell.PowerShellCore:
      return 'com.microsoft.powershell'
    case Shell.Kitty:
      return 'net.kovidgoyal.kitty'
    case Shell.Alacritty:
      return 'io.alacritty'
    case Shell.WezTerm:
      return 'com.github.wez.wezterm'
    default:
      return assertNever(shell, `Unknown shell: ${shell}`)
  }
}

async function getShellPath(shell: Shell): Promise<string | null> {
  const bundleId = getBundleID(shell)
  try {
    return await appPath(bundleId)
  } catch (e) {
    // `appPath` will raise an error if it cannot find the program.
    return null
  }
}

export async function getAvailableShells(): Promise<
  ReadonlyArray<IFoundShell<Shell>>
> {
  const [
    terminalPath,
    hyperPath,
    iTermPath,
    powerShellCorePath,
    kittyPath,
    alacrittyPath,
    wezTermPath,
  ] = await Promise.all([
    getShellPath(Shell.Terminal),
    getShellPath(Shell.Hyper),
    getShellPath(Shell.iTerm2),
    getShellPath(Shell.PowerShellCore),
    getShellPath(Shell.Kitty),
    getShellPath(Shell.Alacritty),
    getShellPath(Shell.WezTerm),
  ])

  const shells: Array<IFoundShell<Shell>> = []
  if (terminalPath) {
    shells.push({ shell: Shell.Terminal, path: terminalPath })
  }

  if (hyperPath) {
    shells.push({ shell: Shell.Hyper, path: hyperPath })
  }

  if (iTermPath) {
    shells.push({ shell: Shell.iTerm2, path: iTermPath })
  }

  if (powerShellCorePath) {
    shells.push({ shell: Shell.PowerShellCore, path: powerShellCorePath })
  }

  if (kittyPath) {
    const kittyExecutable = `${kittyPath}/Contents/MacOS/kitty`
    shells.push({ shell: Shell.Kitty, path: kittyExecutable })
  }

  if (alacrittyPath) {
    const alacrittyExecutable = `${alacrittyPath}/Contents/MacOS/alacritty`
    shells.push({ shell: Shell.Alacritty, path: alacrittyExecutable })
  }

  if (wezTermPath) {
    const wezTermExecutable = `${wezTermPath}/Contents/MacOS/wezterm`
    shells.push({ shell: Shell.WezTerm, path: wezTermExecutable })
  }

  return shells
}

export function launch(
  foundShell: IFoundShell<Shell>,
  path: string
): ChildProcess {
  if (foundShell.shell === Shell.Kitty) {
    // kitty does not handle arguments as expected when using `open` with
    // an existing session but closed window (it reverts to the previous
    // directory rather than using the new directory directory).
    //
    // This workaround launches the internal `kitty` executable which
    // will open a new window to the desired path.
    return spawn(foundShell.path, ['--single-instance', '--directory', path])
  } else if (foundShell.shell === Shell.Alacritty) {
    // Alacritty cannot open files in the folder format.
    //
    // It uses --working-directory command to start the shell
    // in the specified working directory.
    return spawn(foundShell.path, ['--working-directory', path])
  } else if (foundShell.shell === Shell.WezTerm) {
    // WezTerm, like Alacritty, "cannot open files in the 'folder' format."
    //
    // It uses the subcommand `start`, followed by the option `--cwd` to set
    // the working directory, followed by the path.
    return spawn(foundShell.path, ['start', '--cwd', path])
  } else {
    const bundleID = getBundleID(foundShell.shell)
    return spawn('open', ['-b', bundleID, path])
  }
}
