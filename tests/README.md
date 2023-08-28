![Gradient Banner](https://github.com/matter-labs/tutorials/assets/10233439/8efffb9b-ad1f-4bf2-8f73-9cab8f7ccd22)

# zkSync Tutorials

This document contains an instruction of the test infrastructure preparation/running tests locally.

## The environment preparation

To have a possibility of test execution there needs to install a local node (L2) based on the next repository https://github.com/matter-labs/era-test-node.

1. Rust: era-test-node is written in Rust. Ensure you have Rust installed on your machine. [Download Rust here](https://www.rust-lang.org/tools/install).
2. Install package:

```bash
yarn run install:local:node
```

3. Run the node:

```bash
yarn run launch:local:node
```

4. Run tests (before there needs to go the specific folder, eg. hello-world):

```bash
cd hello-world && yarn run test
```