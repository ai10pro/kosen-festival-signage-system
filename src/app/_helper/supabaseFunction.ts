import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const uploadImage = async (filename: string, file: File) => {
  const { data, error } = await supabase.storage
    .from("qiita")
    .upload(`public/${filename}`, file);

  if (error) {
    console.error("Error uploading user card:", error);
    throw new Error("Failed to upload user card");
  }
  console.log("Upload successful:", data);
};

export const getImage = (filename: string) => {
  const { data } = supabase.storage
    .from("qiita")
    .getPublicUrl(`public/${filename}`);

  return data;
};
