import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GovernanceModule = buildModule("GovernanceModule", (m) => {
  const governance = m.contract("Governance", [], {});

  return { governance };
});

export default GovernanceModule;
