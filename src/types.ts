export type TArtifact = {
  abi: unknown[];
  bytecode: string;
};

export type TVulnerability = {
  title: string;
  description: string;
  severity: TVulnerabilitySeverity;
};

export type TVulnerabilitySeverity = "High" | "Medium" | "Low";
