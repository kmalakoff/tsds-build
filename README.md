# tsds-build

Internal build command used by `ts-dev-stack`. It builds the CommonJS, ESM,
and UMD targets selected in the project's `tsds` configuration.

## Install

```bash
npm install --save-dev ts-dev-stack tsds-config
```

## Use

```bash
npx tsds build
```

Configure the project through `ts-dev-stack`; the command cleans `dist` before
building. See the [ts-dev-stack documentation](https://www.npmjs.com/package/ts-dev-stack)
for setup and target configuration.
