import { MAX_IMAGE_SIZE } from "@/const/number";

const isCanvasSupportedWebp = (() => {
  let toBlobSupportWebp: boolean | undefined;

  return function () {
    if (toBlobSupportWebp !== undefined) return toBlobSupportWebp;

    const canvas = document.createElement("canvas");
    toBlobSupportWebp =
      canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
    return toBlobSupportWebp;
  };
})();

export async function convertToBase64(image: File): Promise<string> {
  // read as DataURL
  const readFileAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () =>
        reject(new Error("Failed to read file as data URL"));
      reader.readAsDataURL(file);
    });

  const dataURL = await readFileAsDataURL(image);

  // Create an image element
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Failed to load image for resizing"));
    el.src = dataURL;
  });

  const aspectRatio = img.height / img.width;
  const typeCheck = (() => {
    if (image.type === "image/webp") {
      return true;
    } else if (!isCanvasSupportedWebp()) {
      return image.type === "image/jpeg";
    }
    return false;
  })();

  // 規定サイズ以下かつWebpならならそのまま返す
  if (
    typeCheck &&
    ((aspectRatio >= 1 && img.width <= MAX_IMAGE_SIZE) ||
      (aspectRatio < 1 && img.height <= MAX_IMAGE_SIZE))
  ) {
    return dataURL;
  }

  // 規定サイズを超えるか、Webpでない場合はリサイズ
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (aspectRatio >= 1) {
      canvas.width = MAX_IMAGE_SIZE;
      canvas.height = Math.round(MAX_IMAGE_SIZE * aspectRatio);
    } else {
      canvas.height = MAX_IMAGE_SIZE;
      canvas.width = Math.round(MAX_IMAGE_SIZE / aspectRatio);
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // webpに変換
    const outDataUrl = canvas.toDataURL(
      isCanvasSupportedWebp() ? "image/webp" : "image/jpeg",
      0.75,
    );

    return outDataUrl;
  } catch (error) {
    console.error(error);
    return dataURL;
  }
}
