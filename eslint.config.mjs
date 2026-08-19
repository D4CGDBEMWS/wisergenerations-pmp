import next from 'eslint-config-next'

// Flat config for ESLint 10.
//
// `npm run lint` previously ran `next lint`, which Next 16 removed — it read
// "lint" as a directory argument and errored out. So lint has not run on this
// codebase for some time, which is consistent with what the audit found.
//
// eslint-config-next exports an array of flat configs, so it is spread rather
// than called.
export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/studio/**', // vendored static app, not ours to lint
      'db/**',
    ],
  },
  ...next,
  {
    rules: {
      // Downgraded to warnings so `npm run lint` can gate CI from today.
      //
      // Both are pre-existing and neither is a correctness bug: 16 instances
      // of unescaped-entities are typographic apostrophes in page copy, and
      // the one set-state-in-effect is a legacy effect in
      // app/checkout/success. Turning them into build failures on the same
      // commit that first makes lint run would mean rewriting page content
      // inside a security foundation change.
      //
      // They stay visible as warnings and should be cleared separately.
      'react/no-unescaped-entities': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]

// Note: no @typescript-eslint rules are configured. eslint-config-next's flat
// config does not register that plugin, and referencing its rules here fails
// to load the entire config. Adding them means adding the plugin explicitly,
// which belongs in its own change.
