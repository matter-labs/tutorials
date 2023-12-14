![Gradient Banner](https://github.com/matter-labs/tutorials/assets/10233439/8efffb9b-ad1f-4bf2-8f73-9cab8f7ccd22)

# zkSync Tutorials

This document provides instructions for preparing the test infrastructure and running tests locally.

## The environment preparation

To execute tests, you need to run a local node (L2)

1. Run the node:

```bash
npx zksync-cli dev start
```

2. Run tests (Change directory (cd) into a specific folder, eg. hello-world):

```bash
cd hello-world && yarn run test
```
