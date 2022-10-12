# [GitHub Desktop](https://desktop.github.com)

[GitHub Desktop](https://desktop.github.com/) 是开源的 [Electron](https://www.electronjs.org/)-based
GitHub app. 它是用 [TypeScript](https://www.typescriptlang.org) 和 [React](https://reactjs.org/) 开发的.

![GitHub Desktop screenshot - Windows](https://cloud.githubusercontent.com/assets/359239/26094502/a1f56d02-3a5d-11e7-8799-23c7ba5e5106.png)

## 这是一个什么项目？

这是一个把github desktop翻译成中文的项目, 当前翻译版本[release-3.1.0](https://github.com/gouzil/github-desktop-zh/tree/release-3.1.0)

## 在哪里可以下载到?

下载操作系统的官方安装程序:

 - [macOS](https://central.github.com/deployments/desktop/desktop/latest/darwin)
 - [macOS (Apple silicon)](https://central.github.com/deployments/desktop/desktop/latest/darwin-arm64)
 - [Windows](https://central.github.com/deployments/desktop/desktop/latest/win32)
 - [Windows machine-wide install](https://central.github.com/deployments/desktop/desktop/latest/win32?format=msi)

您可以覆盖安装在现有GitHub Desktop for Mac或GitHub Desktop for Windows应用程序.

Linux不受官方支持；但是，您可以在 [Community Releases](https://github.com/desktop/desktop#community-releases) 搜索查看.

**笔记**: 当前没有将现有存储库导入新应用程序的迁移路径-您可以将存储库从磁盘拖放到应用程序上以开始.


### Beta频道

想在其他人之前测试新功能并得到修复吗？安装测试版频道以访问 Desktop 的早期版本:

 - [macOS](https://central.github.com/deployments/desktop/desktop/latest/darwin?env=beta)
 - [macOS (Apple silicon)](https://central.github.com/deployments/desktop/desktop/latest/darwin-arm64?env=beta)
 - [Windows](https://central.github.com/deployments/desktop/desktop/latest/win32?env=beta)
 - [Windows (ARM64)](https://central.github.com/deployments/desktop/desktop/latest/win32-arm64?env=beta)
 
最新beta版本的发行说明可用 [这里](https://desktop.github.com/release-notes/?env=beta).

### 社区发布

有几个社区支持的包管理器可用于安装GitHub Desktop:

 - Windows用户可以使用 [Chocolatey](https://chocolatey.org/) 软件包管理器:
      `c:\> choco install github-desktop`
 - macOS用户可以使用 [Homebrew](https://brew.sh/) 软件包管理器:
      `$ brew install --cask github`

各种Linux发行版的安装程序可以在
[`shiftkey/desktop`](https://github.com/shiftkey/desktop) fork.

Arch Linux用户可以从
[AUR](https://aur.archlinux.org/packages/github-desktop-bin/).

## GitHub Desktop适合我吗？重点关注的主要领域是什么?

[本文件](https://github.com/desktop/desktop/blob/development/docs/process/what-is-desktop.md) 介绍GitHub Desktop的重点以及该产品对谁最有用.

要了解团队当前和近期的工作内容，请查看 [GitHub Desktop roadmap](https://github.com/desktop/desktop/blob/development/docs/process/roadmap.md).

## GitHub Desktop 存在的问题

笔记: 这个 [GitHub Desktop Code of Conduct](https://github.com/desktop/desktop/blob/development/CODE_OF_CONDUCT.md) 适用于与GitHub Desktop项目相关的所有交互.

首先，请搜索 [open issues](https://github.com/desktop/desktop/issues?q=is%3Aopen)
和 [closed issues](https://github.com/desktop/desktop/issues?q=is%3Aclosed)
查看您的问题是否尚未报告 (也可能已修复).

还有一个列表 [known issues](https://github.com/desktop/desktop/blob/development/docs/known-issues.md)
正在针对 Desktop 进行跟踪，其中一些问题有解决方法.

如果找不到与您所看到的内容匹配的问题，请打开 [new issue](https://github.com/desktop/desktop/issues/new/choose),
选择正确的模板，并为我们提供足够的信息以进行进一步调查.

## 我报告的问题尚未解决. 我能做什么?

如果几天内没有人回复您的问题，欢迎您在该问题上以友好的回应。如果没有人回应，请不要超过第二次回应。GitHub Desktop 维护人员在时间和资源上都很有限，诊断单个配置可能很困难，也很耗时。虽然我们会努力让你找到正确的方向，但我们不能保证我们能够深入研究任何一个人的问题.

## 我如何为GitHub Desktop做出贡献?

这个 [CONTRIBUTING.md](./.github/CONTRIBUTING.md) 文档将帮助您获得设置并熟悉源代码. 这个 [documentation](docs/) 文件夹还包含与项目相关的更多资源.

如果您想协助工作, 查看 [help wanted](https://github.com/desktop/desktop/issues?q=is%3Aissue+is%3Aopen+label%3A%22help%20wanted%22) 标签.

## 更多资源

查看 [desktop.github.com](https://desktop.github.com) 有关GitHub Desktop的更多面向产品的信息.


查看我们的 [getting started documentation](https://docs.github.com/en/desktop/installing-and-configuring-github-desktop/overview/getting-started-with-github-desktop) 有关如何设置、验证和配置GitHub Desktop的更多信息.

## 许可证

**[MIT](LICENSE)**

麻省理工学院的许可证授予不适用于GitHub的商标，其中包括徽标设计。GitHub保留所有GitHub商标的所有商标权和版权。例如，GitHub的徽标包括样式化的Invertocat设计，该设计在以下文件夹的文件标题中包含"徽标": [logos](app/static/logos).

GitHub®及其样式化版本和Invertocat标记是GitHub的商标或注册商标。使用GitHub的徽标时，请确保遵循GitHub [logo guidelines](https://github.com/logos).
