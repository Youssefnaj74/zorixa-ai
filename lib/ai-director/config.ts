import routingJson from "@/data/ai-director-routing.json";

import type { DirectorRoutingConfig, DirectorResolvedStyle } from "@/lib/ai-director/types";

const config = routingJson as DirectorRoutingConfig;

export function getDirectorRoutingConfig(): DirectorRoutingConfig {
  return config;
}

export function directorStyleLabel(style: DirectorResolvedStyle): string {
  return config.styles[style]?.label ?? style;
}
