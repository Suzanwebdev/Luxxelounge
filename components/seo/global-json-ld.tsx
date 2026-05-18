import { JsonLd } from "@/components/seo/json-ld";
import { organizationSchema, websiteSchema } from "@/lib/seo/json-ld";

export function GlobalJsonLd() {
  return <JsonLd data={[organizationSchema(), websiteSchema()]} />;
}
