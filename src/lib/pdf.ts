import PDFParser from "pdf2json";

export async function extractPdfText(buffer: Buffer) {
  return new Promise<string>((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (err) =>
      reject(err)
    );

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      let text = "";

      for (const page of pdfData.Pages) {
        for (const txt of page.Texts) {
          for (const run of txt.R) {
            try {
              text += decodeURIComponent(run.T) + " ";
            } catch {
              text += run.T + " ";
            }
          }
        }
      }

      resolve(text);
    });

    pdfParser.parseBuffer(buffer);
  });
}