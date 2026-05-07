import { toPng, toJpeg } from "html-to-image";

export interface ExportResult {
  success: boolean;
  error?: string;
}

/**
 * Captures a DOM element as a PNG image and triggers a download.
 * @param elementId - The ID of the DOM element to capture
 * @param filename - The download filename (without extension)
 */
export async function exportAsImage(
  elementId: string,
  filename: string,
): Promise<ExportResult> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      return { success: false, error: `Element with ID "${elementId}" not found` };
    }

    const dataUrl = await toPng(element, {
      quality: 1.0,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });

    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();

    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error exporting image";
    return { success: false, error: message };
  }
}

/**
 * Captures a DOM element as a JPEG image and triggers a download.
 * @param elementId - The ID of the DOM element to capture
 * @param filename - The download filename (without extension)
 */
export async function exportAsJPEG(
  elementId: string,
  filename: string,
): Promise<ExportResult> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      return {
        success: false,
        error: `Element with ID "${elementId}" not found`,
      };
    }

    const dataUrl = await toJpeg(element, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });

    const link = document.createElement("a");
    link.download = `${filename}.jpg`;
    link.href = dataUrl;
    link.click();

    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error exporting JPEG";
    return { success: false, error: message };
  }
}

/**
 * Captures a DOM element as a PDF document and triggers a download.
 * Uses html-to-image to render the element to PNG first, then embeds it in a PDF.
 * @param elementId - The ID of the DOM element to capture
 * @param filename - The download filename (without extension)
 */
export async function exportAsPDF(
  elementId: string,
  filename: string,
): Promise<ExportResult> {
  try {
    const { jsPDF } = await import("jspdf");

    const element = document.getElementById(elementId);
    if (!element) {
      return {
        success: false,
        error: `Element with ID "${elementId}" not found`,
      };
    }

    const dataUrl = await toPng(element, {
      quality: 1.0,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
    });

    const imgWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
    pdf.save(`${filename}.pdf`);

    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error exporting PDF";
    return { success: false, error: message };
  }
}
