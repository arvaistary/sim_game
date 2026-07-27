import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { PackageManifest } from './package-boundaries.types'

const packageNames: string[] = ['contracts', 'domain', 'application']

describe('extracted package manifests', () => {
  it('declares all M1 packages as private workspace packages', () => {
    for (const packageName of packageNames) {
      const manifestPath: string = resolve(process.cwd(), 'packages', packageName, 'package.json')
      expect(existsSync(manifestPath)).toBe(true)
      const manifest: PackageManifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as PackageManifest
      expect(manifest.name).toBe(`@game-life/${packageName}`)
      expect(manifest.private).toBe(true)
    }
  })
})
