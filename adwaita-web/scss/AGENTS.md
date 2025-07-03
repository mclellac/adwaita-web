# SASS Coding Conventions

- Always use `@use` instead of `@import` for including SASS modules.
- When using modules imported with `@use`, refer to their variables and mixins using the namespace. For example, if you have `@use 'variables';`, access a variable like `variables.$primary-color`. If you have `@use 'mixins';`, use a mixin like `mixins.my-mixin();`.

This is to prevent deprecation warnings and align with modern SASS best practices. Dart SASS will remove `@import` in version 3.0.0.
