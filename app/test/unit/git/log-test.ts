import { Repository } from '../../../src/models/repository'
import { getChangedFiles, getCommits } from '../../../src/lib/git'
import { setupFixtureRepository } from '../../helpers/repositories'
import { AppFileStatusKind } from '../../../src/models/status'
import { setupLocalConfig } from '../../helpers/local-config'

describe('git/log', () => {
  let repository: Repository

  beforeEach(async () => {
    const testRepoPath = await setupFixtureRepository('test-repo-with-tags')
    repository = new Repository(testRepoPath, -1, null, false)
  })

  describe('getCommits', () => {
    it('loads history', async () => {
      const commits = await getCommits(repository, 'HEAD', 100)
      expect(commits).toHaveLength(5)

      const firstCommit = commits[commits.length - 1]
      expect(firstCommit.summary).toBe('first')
      expect(firstCommit.sha).toBe('7cd6640e5b6ca8dbfd0b33d0281ebe702127079c')
      expect(firstCommit.shortSha).toBe('7cd6640')
    })

    it('handles repository with HEAD file on disk', async () => {
      const path = await setupFixtureRepository('repository-with-HEAD-file')
      const repo = new Repository(path, 1, null, false)
      const commits = await getCommits(repo, 'HEAD', 100)
      expect(commits).toHaveLength(2)
    })

    it('handles repository with signed commit and log.showSignature set', async () => {
      const path = await setupFixtureRepository('just-doing-some-signing')
      const repository = new Repository(path, 1, null, false)

      // ensure the default config is to try and show signatures
      // this should be overriden by the `getCommits` function as it may not
      // have a valid GPG agent configured
      await setupLocalConfig(repository, [['log.showSignature', 'true']])

      const commits = await getCommits(repository, 'HEAD', 100)

      expect(commits).toHaveLength(1)
      expect(commits[0].sha).toBe('415e4987158c49c383ce7114e0ef00ebf4b070c1')
      expect(commits[0].shortSha).toBe('415e498')
    })

    it('parses tags', async () => {
      const commits = await getCommits(repository, 'HEAD', 100)
      expect(commits).toBeArrayOfSize(5)

      expect(commits[0].tags).toIncludeSameMembers(['important'])
      expect(commits[1].tags).toIncludeSameMembers([
        'tentative',
        'less-important',
      ])
      expect(commits[2].tags).toBeArrayOfSize(0)
    })
  })

  describe('getChangedFiles', () => {
    it('loads the files changed in the commit', async () => {
      const changesetData = await getChangedFiles(
        repository,
        '7cd6640e5b6ca8dbfd0b33d0281ebe702127079c'
      )
      expect(changesetData.files).toHaveLength(1)
      expect(changesetData.files[0].path).toBe('README.md')
      expect(changesetData.files[0].status.kind).toBe(AppFileStatusKind.New)
    })

    it('detects renames', async () => {
      const testRepoPath = await setupFixtureRepository(
        'rename-history-detection'
      )
      repository = new Repository(testRepoPath, -1, null, false)

      const first = await getChangedFiles(repository, '55bdecb')
      expect(first.files).toHaveLength(1)

      expect(first.files[0].path).toBe('NEWER.md')
      expect(first.files[0].status).toEqual({
        kind: AppFileStatusKind.Renamed,
        oldPath: 'NEW.md',
      })

      const second = await getChangedFiles(repository, 'c898ca8')
      expect(second.files).toHaveLength(1)

      expect(second.files[0].path).toBe('NEW.md')
      expect(second.files[0].status).toEqual({
        kind: AppFileStatusKind.Renamed,
        oldPath: 'OLD.md',
      })
    })

    it('detect copies', async () => {
      const testRepoPath = await setupFixtureRepository(
        'copies-history-detection'
      )
      repository = new Repository(testRepoPath, -1, null, false)

      // ensure the test repository is configured to detect copies
      await setupLocalConfig(repository, [['diff.renames', 'copies']])

      const changesetData = await getChangedFiles(repository, 'a500bf415')
      expect(changesetData.files).toHaveLength(2)

      expect(changesetData.files[0].path).toBe('duplicate-with-edits.md')
      expect(changesetData.files[0].status).toEqual({
        kind: AppFileStatusKind.Copied,
        oldPath: 'initial.md',
      })

      expect(changesetData.files[1].path).toBe('duplicate.md')
      expect(changesetData.files[1].status).toEqual({
        kind: AppFileStatusKind.Copied,
        oldPath: 'initial.md',
      })
    })

    it('handles commit when HEAD exists on disk', async () => {
      const changesetData = await getChangedFiles(repository, 'HEAD')
      expect(changesetData.files).toHaveLength(1)
      expect(changesetData.files[0].path).toBe('README.md')
      expect(changesetData.files[0].status.kind).toBe(
        AppFileStatusKind.Modified
      )
    })
  })
})
