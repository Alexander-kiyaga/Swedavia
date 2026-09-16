export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
    const hasModuleExtension = /\.[cm]?[jt]sx?$/.test(specifier);
    if (isRelative && !hasModuleExtension) {
      return nextResolve(`${specifier}.ts`, context);
    }
    throw error;
  }
}
