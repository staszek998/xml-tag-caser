import { readFileSync } from 'node:fs'
import * as path from 'node:path'

import { expect, test } from '@oclif/test'

import { Casing } from '../../../src/commands/switch/contracts.js'

const TEST_CASES: Array<{
  from: Casing;
  includeHtmlTags?: boolean;
  inputFilePath: string;
  outputFilePath: string;
  to: Casing;
}> = [
  // kebab-case => PascalCase
  {
    from: Casing.Kebab,
    inputFilePath: './test/commands/switch/test-files/from-kebab/input.vue',
    outputFilePath: './test/commands/switch/test-files/from-kebab/output.pascal.vue',
    to: Casing.Pascal,
  },

  // kebab-case => PascalCase --include-html-tags
  {
    from: Casing.Kebab,
    includeHtmlTags: true,
    inputFilePath: './test/commands/switch/test-files/from-kebab/input.vue',
    outputFilePath: './test/commands/switch/test-files/from-kebab/output.pascal.include-html-tags.vue',
    to: Casing.Pascal,
  },

  // kebab-case => kebab-case
  {
    from: Casing.Kebab,
    inputFilePath: './test/commands/switch/test-files/from-kebab/input.vue',
    outputFilePath: './test/commands/switch/test-files/from-kebab/output.kebab.vue',
    to: Casing.Kebab,
  },

  // kebab-case => kebab-case --include-html-tags
  {
    from: Casing.Kebab,
    includeHtmlTags: true,
    inputFilePath: './test/commands/switch/test-files/from-kebab/input.vue',
    outputFilePath: './test/commands/switch/test-files/from-kebab/output.kebab.include-html-tags.vue',
    to: Casing.Kebab,
  },

  // PascalCase => kebab-case
  {
    from: Casing.Pascal,
    inputFilePath: './test/commands/switch/test-files/from-pascal/input.vue',
    outputFilePath: './test/commands/switch/test-files/from-pascal/output.pascal.vue',
    to: Casing.Pascal,
  },

  // PascalCase => kebab-case --include-html-tags
  {
    from: Casing.Pascal,
    includeHtmlTags: true,
    inputFilePath: './test/commands/switch/test-files/from-pascal/input.vue',
    outputFilePath: './test/commands/switch/test-files/from-pascal/output.pascal.include-html-tags.vue',
    to: Casing.Pascal,
  },

  // PascalCase => PascalCase
  {
    from: Casing.Pascal,
    inputFilePath: './test/commands/switch/test-files/from-pascal/input.vue',
    outputFilePath: './test/commands/switch/test-files/from-pascal/output.kebab.vue',
    to: Casing.Kebab,
  },

  // PascalCase => PascalCase --include-html-tags
  {
    from: Casing.Pascal,
    includeHtmlTags: true,
    inputFilePath: './test/commands/switch/test-files/from-pascal/input.vue',
    outputFilePath: './test/commands/switch/test-files/from-pascal/output.kebab.include-html-tags.vue',
    to: Casing.Kebab,
  },
]

describe('switch', () => {
  for (const { from, includeHtmlTags, inputFilePath, outputFilePath, to } of TEST_CASES) {
    test
      .stdout()
      .command([
        'switch',
        inputFilePath,
        `--from=${from}`,
        `--to=${to}`,
        '--dry-run',
        ...(includeHtmlTags ? [ '--include-html-tags' ] : []),
      ])
      .it(`Correctly switches casing from ${from} to ${to}`, ctx => {
        const expectedOutput: string = readFileSync(
          path.resolve(process.cwd(), outputFilePath),
        ).toString()

        expect(ctx.stdout.trim()).to.equal(expectedOutput.trim())
      })
  }
})
