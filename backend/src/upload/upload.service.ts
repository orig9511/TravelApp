import { Injectable, Logger } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import * as path from "path";

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private supabase: SupabaseClient | null = null;
  private readonly bucket = "offer-images";

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (url && key) {
      this.supabase = createClient(url, key);
      this.logger.log("Supabase Storage client initialized");
    } else {
      this.logger.warn(
        "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — uploads will fail",
      );
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = "offers",
  ): Promise<string> {
    if (!this.supabase) {
      throw new Error(
        "Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env",
      );
    }

    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const fileName = `${folder}/${uuidv4()}${ext}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(fileName);

    return data.publicUrl;
  }
}
