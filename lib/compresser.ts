const COTE_MAX = 1600;

function encoder(
  canvas: HTMLCanvasElement,
  type: string,
  qualite: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, qualite));
}

export async function compresserPhoto(fichier: File): Promise<Blob> {
  const image = await createImageBitmap(fichier, {
    imageOrientation: "from-image",
  });

  const echelle = Math.min(1, COTE_MAX / Math.max(image.width, image.height));
  const largeur = Math.round(image.width * echelle);
  const hauteur = Math.round(image.height * echelle);

  const canvas = document.createElement("canvas");
  canvas.width = largeur;
  canvas.height = hauteur;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, largeur, hauteur);
  ctx.drawImage(image, 0, 0, largeur, hauteur);
  image.close();

  const webp = await encoder(canvas, "image/webp", 0.8);
  if (webp && webp.type === "image/webp") return webp;

  const jpeg = await encoder(canvas, "image/jpeg", 0.8);
  if (jpeg) return jpeg;

  throw new Error("Encodage impossible");
}