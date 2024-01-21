export enum Casing {
  Kebab = 'kebab',
  Pascal = 'pascal',
}

export type CasingFn = (tag: string) => string
