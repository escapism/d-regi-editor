const isCncasSupportedWebp = (() => {
  let toBlobSupportWebp : boolean | undefined;

  return function() {
    if (toBlobSupportWebp !== undefined) return toBlobSupportWebp;

    const canvas = document.createElement('canvas');
    toBlobSupportWebp = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    return toBlobSupportWebp;
  };
})();

export async function convertToBase64(image: File): Promise<string> {
  // 1. read as DataURL
  const readFileAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file as data URL'));
      reader.readAsDataURL(file);
    });

  const dataURL = await readFileAsDataURL(image);

  // 2. Create an image element
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Failed to load image for resizing'));
    el.src = dataURL;
  });

  if (img.width <= 480) {
    // 3a. 480pxより小さい: そのままbase64を返す
    return dataURL;
  }

  // 3b. 横幅が480pxを超える→変換
  const canvas = document.createElement('canvas');
  const scale = 480 / img.width;
  canvas.width = 480;
  canvas.height = Math.floor(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // webpに変換
  const outDataUrl = canvas.toDataURL(isCncasSupportedWebp() ? 'image/webp' : 'image/jpeg', 0.8);

  return outDataUrl;
}