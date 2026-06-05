import { AppError } from "../lib/errors";
import { treeAnalysisMetadataSchema } from "../schemas";
import type { TreeAnalysisInput } from "../services/tree-analysis";

export function parseTreeAnalysisMultipart(
  contentType: string | undefined,
  rawBody: Buffer | undefined,
): TreeAnalysisInput {
  const boundary = readBoundary(contentType);

  if (!rawBody || rawBody.length === 0) {
    throw new AppError("VALIDATION_ERROR", 400, "Upload an image file.");
  }

  const fields: Record<string, unknown> = {};
  let file: TreeAnalysisInput["file"] | undefined;
  const body = rawBody.toString("binary");
  const parts = body.split(`--${boundary}`);

  for (const part of parts) {
    if (!part || part === "--\r\n" || part === "--") {
      continue;
    }

    const trimmed = part.startsWith("\r\n") ? part.slice(2) : part;
    const [rawHeaders, ...rest] = trimmed.split("\r\n\r\n");
    const content = rest.join("\r\n\r\n").replace(/\r\n--$/, "").replace(/\r\n$/, "");
    const disposition = /content-disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i.exec(rawHeaders);

    if (!disposition) {
      continue;
    }

    const [, name, filename] = disposition;
    const partContentType = /content-type:\s*([^\r\n]+)/i.exec(rawHeaders)?.[1]?.trim();

    if (filename) {
      file = {
        buffer: Buffer.from(content, "binary"),
        contentType: partContentType ?? "application/octet-stream",
        filename,
        size: Buffer.byteLength(content, "binary"),
      };
    } else if (name === "landAcres" && content.trim() !== "") {
      fields[name] = Number(content);
    } else {
      fields[name] = content.trim() || undefined;
    }
  }

  if (!file) {
    throw new AppError("VALIDATION_ERROR", 400, "Upload an image file.");
  }

  return {
    file,
    ...treeAnalysisMetadataSchema.parse(fields),
  };
}

function readBoundary(contentType: string | undefined): string {
  const boundary = /boundary=([^;]+)/i.exec(contentType ?? "")?.[1];

  if (!boundary) {
    throw new AppError(
      "VALIDATION_ERROR",
      400,
      "Use multipart/form-data for tree analysis uploads.",
    );
  }

  return boundary;
}
