/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['deep', 'global'] }],
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z][a-z0-9]*(-[a-z0-9]+)*)?(--[a-z][a-z0-9]*(-[a-z0-9]+)*)?$',
      {
        message: 'Expected class selector to be kebab-case or valid BEM notation',
      },
    ],
    'scss/at-mixin-pattern': null,
    'scss/dollar-variable-pattern': null,
    'no-descending-specificity': null,
    'color-hex-length': null,
  },
}
