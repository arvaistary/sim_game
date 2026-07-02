/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['deep', 'global'] }],
    'scss/at-mixin-pattern': null,
    'scss/dollar-variable-pattern': null,
    'no-descending-specificity': null,
    'color-hex-length': null,
  },
}
