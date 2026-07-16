export function shouldEnableReactDevTools(
  nodeEnvironment: string | undefined,
  publicOptIn: string | undefined,
): boolean {
  return nodeEnvironment === "development" && publicOptIn === "1";
}
