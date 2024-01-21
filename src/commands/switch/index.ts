import { readFileSync, writeFileSync } from 'node:fs'

import { Args, Command, Flags } from '@oclif/core'
import { kebabCase, pascalCase } from 'change-case'
import { glob } from 'glob'

import { STANDARD_HTML_ELEMENTS } from './config.js'
import { Casing, CasingFn } from './contracts.js'

export default class Switch extends Command {
  static args = {
    glob: Args.string({
      description: 'The glob pattern describing the files that are a subject for the casing switch.',
      required: true,
    }),
  }

  static description = 'Switch casing in the files matching a given glob pattern.'

  static examples = [
    '$ xml-tag-caser switch "./**/*.vue" --from kebab --to pascal',
    '$ xml-tag-caser switch "./**/*.vue" --from pascal --to kebab',
  ]

  static flags = {
    'dry-run': Flags.boolean({
      default: false,
      description: 'Determines whether the script should perform a dry-run, logging the output to the console (instead of modifying the files).',
      required: false,
    }),
    from: Flags.string({
      default: undefined,
      description: 'Which casings should be replaced?',
      helpValue: `<${Object.values(Casing).join('|')}>`,
      required: true,
    }),
    'include-html-tags': Flags.boolean({
      default: false,
      description: 'Determines whether the replacer function should also process the standard HTML tags.',
      required: false,
    }),
    to: Flags.string({
      default: undefined,
      description: 'What is the target casing?',
      helpValue: `<${Object.values(Casing).join('|')}>`,
      required: true,
    }),
  }

  /**
   * Parsed arguments.
   *
   * @see args
   * @see run
   */
  _args?: {
    glob: string;
  }

  /**
   * Parsed flags.
   *
   * @see flags
   * @see run
   */
  _flags?: {
    dryRun: boolean;
    from: Casing;
    includeHtmlTags: boolean;
    to: Casing;
  }

  /**
   * Asserts that the passed-in argument is a valid `Casing`.
   *
   * @param possibleCasing - Possible casing that is to be verified.
   *
   * @returns {void}
   */
  private static assertValidCasing (possibleCasing: unknown): asserts possibleCasing is Casing {
    if (!Object.values(Casing).includes(possibleCasing as Casing)) {
      throw new Error(`The passed-in '${possibleCasing}' argument is NOT a valid 'Casing'!`)
    }
  }

  /**
   * Resolves the applicable casing function for a given `targetCasing`.
   *
   * @param targetCasing - The target Casing we want to achieve.
   *
   * @returns {CasingFn} - The casing function applicable for the specified `targetCasing`.
   */
  private static getCasingFunction (targetCasing: Casing): CasingFn {
    switch (targetCasing) {
      case Casing.Kebab: {
        return kebabCase
      }

      case Casing.Pascal: {
        return pascalCase
      }
    }
  }

  /**
   * Resolves the applicable regular expression matcher for a given `Casing`.
   *
   * @param casing - The Casing which we'd like to match.
   *
   * @returns {RegExp} - An applicable matcher.
   */
  private static getMatcherForCasing (casing: Casing): RegExp {
    switch (casing) {
      case Casing.Kebab: {
        return /<\/?([a-z]+(-[a-z]+)*)([^>]*)>?/g
      }

      case Casing.Pascal: {
        return /<\/?([A-Z][a-z]*([A-Z][a-z]*)*)(?![\s\w]*>[\s\w]*\()/g
      }
    }
  }

  /**
   * Resolves the files matching the given glob pattern.
   *
   * Note: glob patterns with special characters should be appropriately escaped.
   * Throws an error if reading files fails.
   *
   * @param globPattern - The glob pattern which should be used to scan the files.
   *
   * @returns The list of the files matching the provided glob pattern.
   */
  private static async getMatchingFiles (globPattern: string): Promise<string[]> {
    return glob(globPattern)
  }

  /**
   * Switches the casing of the passed-in tag.
   *
   * @param sourceTag - The XML tag which casing is to be switched.
   * @param targetCasing - The target casing.
   *
   * @returns {string} - The same XML tag, but in a different casing
   *   (as specified by the `targetCasing` argument).
   */
  private static switchTagCasing (sourceTag: string, targetCasing: Casing): string {
    const casingFunction: CasingFn = Switch.getCasingFunction(targetCasing)
    return casingFunction(sourceTag)
  }

  async run (): Promise<void> {
    const { args, flags } = await this.parse(Switch)

    this._args = {
      glob: args.glob,
    }

    const fromCasing = flags.from
    const toCasing = flags.to

    Switch.assertValidCasing(fromCasing)
    Switch.assertValidCasing(toCasing)

    this._flags = {
      dryRun: flags['dry-run'],
      from: fromCasing,
      includeHtmlTags: flags['include-html-tags'],
      to: toCasing,
    }

    const matchingFiles: string[] = await Switch.getMatchingFiles(args.glob)

    await Promise.allSettled(matchingFiles.map(filePath => (
      this.switchCasingInFile(filePath, fromCasing, toCasing)
    )))
  }

  /**
   * Determines whether the casing of the given tag should be switched.
   *
   * @param tag - The tag to verify.
   *
   * @returns {boolean} - `true` if the tag's casing should be switched; otherwise `false`.
   */
  private shouldSwitchTagCasing (tag: string): boolean {
    const isHtmlTag: boolean = STANDARD_HTML_ELEMENTS.includes(tag.trim().toLowerCase())

    return this._flags?.includeHtmlTags === true
      ? true
      : !isHtmlTag
  }

  /**
   * Switches the casing in a given file.
   *
   * @param filePath - The path of the file that is to be processed.
   * @param from - The casing which should be replaced.
   * @param to - The target casing.
   *
   * @returns {void}
   */
  private switchCasingInFile (
    filePath: string,
    from: Casing,
    to: Casing,
  ): void {
    const originalContent: string = readFileSync(filePath).toString()
    const matcher: RegExp = Switch.getMatcherForCasing(from)

    const modifiedContent: string = originalContent.replace(matcher, (match, originalTag) => {
      if (!this.shouldSwitchTagCasing(originalTag)) {
        return match
      }

      const convertedTag: string = Switch.switchTagCasing(originalTag, to)
      return match.replace(originalTag, convertedTag)
    })

    if (this._flags?.dryRun) {
      this.log(modifiedContent)
    } else {
      writeFileSync(filePath, modifiedContent)
    }
  }
}

