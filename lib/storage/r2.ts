import "server-only";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";

const allowed = new Map([
  ["image/jpeg", [0xff, 0xd8, 0xff]],
  ["image/png", [0x89, 0x50, 0x4e, 0x47]],
  ["application/pdf", [0x25, 0x50, 0x44, 0x46]]
]);

export const uploadRequestSchema = z.object({
  workspaceId: z.uuid(), academyId: z.uuid(), category: z.enum(["student-photo", "payment-proof", "incident-evidence", "report"]),
  fileName: z.string().min(1).max(120).regex(/^[\w. -]+$/), mime: z.enum(["image/jpeg", "image/png", "application/pdf"]), size: z.number().int().positive().max(5 * 1024 * 1024)
});

function client() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) throw new Error("R2 no está configurado");
  return new S3Client({ region: "auto", endpoint, credentials: { accessKeyId, secretAccessKey } });
}

export async function createPrivateUpload(input: z.infer<typeof uploadRequestSchema>) {
  const parsed = uploadRequestSchema.parse(input);
  const extension = parsed.mime === "image/jpeg" ? "jpg" : parsed.mime === "image/png" ? "png" : "pdf";
  const key = `${parsed.workspaceId}/${parsed.academyId}/${parsed.category}/${crypto.randomUUID()}.${extension}`;
  const command = new PutObjectCommand({ Bucket: process.env.R2_BUCKET_PRIVATE, Key: key, ContentType: parsed.mime, ContentLength: parsed.size, Metadata: { workspace: parsed.workspaceId } });
  return { key, url: await getSignedUrl(client(), command, { expiresIn: 300 }), expiresIn: 300 };
}

export async function createPrivateDownload(key: string) {
  if (key.includes("..") || key.startsWith("/")) throw new Error("Clave de objeto inválida");
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: process.env.R2_BUCKET_PRIVATE, Key: key }), { expiresIn: 120 });
}

export function sniffMime(bytes: Uint8Array, claimed: string) {
  const signature = allowed.get(claimed);
  return Boolean(signature?.every((byte, index) => bytes[index] === byte));
}

export async function verifyPrivateUpload(key: string, claimedMime: string, workspaceId: string) {
  if (!key.startsWith(`${workspaceId}/`) || key.includes("..")) throw new Error("Clave fuera de alcance");
  const storage = client(); const bucket = process.env.R2_BUCKET_PRIVATE;
  const object = await storage.send(new GetObjectCommand({ Bucket: bucket, Key: key, Range: "bytes=0-31" }));
  const bytes = new Uint8Array(await object.Body!.transformToByteArray());
  const valid = sniffMime(bytes, claimedMime) && Number(object.ContentRange?.split("/")[1] ?? object.ContentLength ?? 0) <= 5 * 1024 * 1024;
  if (!valid) { await storage.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })); throw new Error("El contenido real del archivo no coincide o excede el límite"); }
  return { key, mime: claimedMime, verified: true };
}
