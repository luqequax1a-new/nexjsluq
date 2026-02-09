import { uploadGlobalImage } from "@/lib/api/media-upload";

export type RichTextUploadScope = "global" | "product" | "variant";
export type RichTextUploadType = "image" | "video" | "file";

export interface TinyMCEInitOptions {
  height?: number;
  directionality?: "ltr" | "rtl";
}

async function uploadMediaFile(args: {
  file: File;
  scope?: RichTextUploadScope;
  type?: RichTextUploadType;
  alt?: string;
}): Promise<{ url: string }>
{
  // For now we only support global scope via uploadGlobalImage (image)
  // TODO: extend uploadGlobalImage or create generic uploadMedia for video/file
  if (args.type !== "image") {
    throw new Error("Only image uploads are supported in this version");
  }

  const { url } = await uploadGlobalImage(args.file, { alt: args.alt });
  return { url };
}

export function createTinyMCEInit(overrides: TinyMCEInitOptions = {}) {
  const directionality = overrides.directionality ?? "ltr";

  return {
    height: overrides.height ?? 350,
    menubar: false,
    branding: false,
    theme: "silver",
    directionality,
    toolbar_mode: "sliding",
    relative_urls: false,
    baseURL: "/tinymce",
    automatic_uploads: true,
    image_advtab: true,
    media_alt_source: false,
    media_poster: false,
    // Performance optimizations
    cache_suffix: "?v=1",
    resize: false,
    statusbar: false,
    elementpath: false,
    keep_styles: false,
    // Reduce plugins for better performance
    plugins:
      "lists link table image autolink quickbars wordcount code",
    toolbar:
      "styleselect | bold italic underline strikethrough blockquote | bullist numlist | alignleft aligncenter alignright alignjustify | outdent indent | forecolor removeformat | table | image link | code",
    quickbars_selection_toolbar:
      "bold italic | quicklink h2 h3 blockquote quickimage quicktable",
    extended_valid_elements: "img[class|src|alt|title|width|loading=lazy]",
    content_style: `
      body {
        font-size: 14px;
        color: #555555;
      }
    `,
    // Performance settings
    paste_data_images: false,
    paste_as_text: false,
    // Disable unused features
    contextmenu: false,
    contextmenu_never_use_native: true,
    // Optimize rendering
    content_css_cors: false,
    importcss_append: false,
    // Touch event optimization
    touch_action: 'none',

    images_upload_handler: async (blobInfo: any) => {
      const { url } = await uploadMediaFile({
        file: blobInfo.blob(),
        scope: "global",
        type: "image",
        alt: blobInfo.filename?.() ? String(blobInfo.filename()) : undefined,
      });

      return url;
    },

    file_picker_types: "image media",
    file_picker_callback: (callback: any, _value: any, meta: any) => {
      const input = document.createElement("input");
      input.type = "file";

      if (meta?.filetype === "image") {
        input.accept = "image/*";
      } else if (meta?.filetype === "media") {
        input.accept = "video/*";
      }

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        const isImage = meta?.filetype === "image";
        const type: RichTextUploadType = isImage ? "image" : "video";

        try {
          const { url } = await uploadMediaFile({
            file,
            scope: "global",
            type,
            alt: isImage ? file.name : undefined,
          });

          if (isImage) {
            callback(url, { alt: file.name });
            return;
          }

          callback(url);
        } catch (error) {
          console.error('File upload failed:', error);
        }
      };

      input.click();
    },
  };
}
