# Contributing

Thank you for helping improve ligatrix-components.

## Running the project

You need Node.js 20 or later. There are no dependencies to install.

```sh
npm test            # run the test suite
npm run lint        # check whitespace and final newlines
npm run gallery     # re-render gallery/index.html after changing a component or the stylesheet
```

Open `gallery/index.html` in a browser to check your change visually, in both light and dark mode (the buttons at the
top right switch theme).

## Branches

- Branch from `main`, using a short descriptive name: `fix/table-empty-colspan`, `feat/tabs-component`.
- Keep each branch to one change. Rebase on `main` before opening a pull request.

## Commit style

- Write the subject in the imperative, under 72 characters: « Add compact density to data table ».
- Explain in the body why the change is needed when it is not obvious from the subject.
- Keep commits logical: a refactor and a behaviour change go in separate commits.

## Adding or changing a component

- Escape every text option with `escapeHtml`. Only options whose name ends in `Html` may be inserted unescaped.
- Build attributes with `attrs()` so names are validated and URLs are filtered.
- Validate enumerated options with `oneOf()` and throw on bad input rather than rendering something wrong.
- Add the component to `src/index.mjs`, `src/index.d.ts`, `test/injection.test.mjs`, the gallery and the README table.

## Pull request checklist

- [ ] `npm test` passes.
- [ ] `npm run lint` passes.
- [ ] New behaviour has tests, including hostile input for any new text option.
- [ ] `src/index.d.ts` matches the exports.
- [ ] `npm run gallery` was run and `gallery/index.html` is committed.
- [ ] README and CHANGELOG are updated where behaviour changed.
