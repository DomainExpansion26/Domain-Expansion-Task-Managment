import fs from "fs";
import path from "path";
import { supabaseAdmin, isSupabaseConfigured } from "./supabase";

export interface UploadedFileInfo {
  fileName: string;
  storagePath: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}

/**
 * Storage Helper
 * Supports Supabase Storage buckets or local secure storage
 */
export async function uploadFileToStorage(
  file: any,
  originalName: string,
  contentType: string,
  folder = "general"
): Promise<UploadedFileInfo> {
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  const uniqueKey = `${folder}/${timestamp}-${sanitizedName}`;

  let buffer: Buffer;
  let fileSize = 0;

  if (Buffer.isBuffer(file)) {
    buffer = file;
    fileSize = buffer.length;
  } else if (file && typeof file.arrayBuffer === "function") {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
    fileSize = file.size || buffer.length;
  } else {
    buffer = Buffer.from(file || "");
    fileSize = buffer.length;
  }

  // 1. Check if Supabase Storage is configured
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const bucketName = "domain-expansion-assets";
      
      // Upload using official Supabase client with timeout fallback
      const uploadPromise = supabaseAdmin.storage
        .from(bucketName)
        .upload(uniqueKey, buffer, {
          contentType,
          upsert: true,
        });

      const timeoutPromise = new Promise<any>((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: "Supabase upload timed out, using local fallback" } }), 4000)
      );

      const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

      if (!error && data) {
        const { data: urlData } = supabaseAdmin.storage
          .from(bucketName)
          .getPublicUrl(uniqueKey);

        return {
          fileName: originalName,
          storagePath: `${bucketName}/${uniqueKey}`,
          fileUrl: urlData.publicUrl,
          fileSize,
          fileType: contentType,
        };
      } else if (error) {
        console.warn("Supabase upload returned error, falling back to local storage:", error.message);
      }
    } catch (err: any) {
      console.warn("Supabase storage exception, fallback to local:", err.message);
    }
  }

  // 2. Fallback to local server filesystem storage
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const localFilePath = path.join(uploadDir, `${timestamp}-${sanitizedName}`);
  fs.writeFileSync(localFilePath, buffer);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const publicUrl = `${appUrl}/uploads/${folder}/${timestamp}-${sanitizedName}`;

  return {
    fileName: originalName,
    storagePath: `uploads/${folder}/${timestamp}-${sanitizedName}`,
    fileUrl: publicUrl,
    fileSize,
    fileType: contentType,
  };
}
