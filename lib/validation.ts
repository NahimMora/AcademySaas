import { z } from "zod";

// zod's z.uuid() requires an RFC 4122 version/variant nibble, but this project's seed
// data uses simplified sequential ids (e.g. "a2000000-0000-0000-0000-000000000001")
// that Postgres accepts as a valid uuid column value without that constraint.
export const uuidSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Identificador inválido");
