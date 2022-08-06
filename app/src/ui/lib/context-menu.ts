const RestrictedFileExtensions = ['.cmd', '.exe', '.bat', '.sh']
export const CopyFilePathLabel = __DARWIN__ ? '拷贝文件路径' : '拷贝文件路径'

export const CopyRelativeFilePathLabel = __DARWIN__
  ? '复制相对文件路径'
  : '复制相对文件路径'

export const CopySelectedPathsLabel = __DARWIN__ ? '复制路径' : '复制路径'

export const CopySelectedRelativePathsLabel = __DARWIN__
  ? '复制相对路径'
  : '复制相对路径'

export const DefaultEditorLabel = __DARWIN__
  ? '在外部编辑器中打开'
  : '在外部编辑器中打开'

export const RevealInFileManagerLabel = __DARWIN__
  ? '在访达 (Finder) 中显示'
  : __WIN32__
  ? '在资源管理器 (Explorer) 中显示'
  : '在文件管理器中 (File Manager) 显示'

export const TrashNameLabel = __WIN32__ ? '回收站' : '垃圾桶'

export const OpenWithDefaultProgramLabel = __DARWIN__
  ? '使用默认程序打开'
  : '使用默认程序打开'

export function isSafeFileExtension(extension: string): boolean {
  if (__WIN32__) {
    return RestrictedFileExtensions.indexOf(extension.toLowerCase()) === -1
  }
  return true
}
