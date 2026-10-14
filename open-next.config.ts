import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
  ...defineCloudflareConfig(),
  buildCommand: "CAMPUS_CLOUDFLARE=1 npm run build -- --webpack",
};
