import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import download from "downloadjs";

enum ImageFormats {
  PNG,
  JPG,
}

export default function PDFMerger() {
  const [pdf, setPdf] = useState<null | PDFDocument>(null);
  const [fileList, setFileList] = useState<[] | FileList>([]);

  useEffect(() => {
    async function initPdf() {
      const pdfDoc = await PDFDocument.create();
      setPdf(pdfDoc);
    }

    initPdf().then((r) => {
      console.log("init pdf successfully");
    });
  }, []);

  async function addImage(
    imageBytes: string | ArrayBuffer,
    type: ImageFormats
  ) {
    if (pdf == null) {
      console.log("pdf is not init");
      return;
    }

    let image;
    switch (type) {
      case ImageFormats.JPG:
        image = await getJpgImage(imageBytes);
        break;
      case ImageFormats.PNG:
        image = await getPngImage(imageBytes);
        break;
      default:
        return;
    }

    if (image) {
      const dims = image.scale(1);
      const page = pdf.addPage();
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: dims.width,
        height: dims.height,
      });
    } else {
      console.log("failed to get image");
    }
  }

  async function addPdf(pdfByte: string | ArrayBuffer) {
    const newPDF = await PDFDocument.load(pdfByte);
    if (pdf) {
      const copiedPages = await pdf.copyPages(newPDF, newPDF.getPageIndices());
      copiedPages.forEach((page) => pdf.addPage(page));
    } else {
      console.log("pdf not init");
    }
  }

  async function getJpgImage(imageBytes: string | ArrayBuffer) {
    if (pdf == null) {
      console.log("pdf not init");
      return;
    }

    return await pdf.embedJpg(imageBytes);
  }

  async function getPngImage(imageBytes: string | ArrayBuffer) {
    if (pdf == null) {
      console.log("pdf not init");
      return;
    }

    return await pdf.embedPng(imageBytes);
  }

  async function downloadPdf() {
    if (pdf == null) {
      console.log("pdf is not initiated");
      return;
    }
    console.log(pdf);
    const pdfBytes = await pdf.save();
    download(
      pdfBytes,
      "pdf-lib_image_embedding_example.pdf",
      "application/pdf"
    );

    await resetPDF();
  }
  async function onFileUpload(input: FileList | null) {
    if (!input) {
      return console.log("no file input");
    }

    setFileList(input);
    console.log(input);

    Array.from(input).forEach((file) => {
      const reader = new FileReader();
      const fileType = file.type;

      reader.onerror = () => {
        console.error("failed to read file to buffer", file, reader.error);
      };

      reader.onload = () => {
        if (reader.result == null) {
          console.error("file result is null", file, reader.error);
          return;
        }

        console.info("successfully read file", file);
        if (fileType === "image/jpeg") {
          addImage(reader.result, ImageFormats.JPG);
        } else if (fileType === "image/png") {
          addImage(reader.result, ImageFormats.PNG);
        } else if (fileType === "application/pdf") {
          addPdf(reader.result);
        }

        console.info("successfully embed file to pdf", file);
      };

      reader.readAsArrayBuffer(file);
    });
  }

  async function resetPDF() {
    setFileList([]);
    const pdfDoc = await PDFDocument.create();
    setPdf(pdfDoc);
  }

  return (
    <div>
      <h1 className="lg:text-8xl text-4xl font-extrabold text-center">
        <span className="underline">Quick</span> PDF
      </h1>
      <p className="lg:text-2xl text-lg text-center mt-4 mb-8">
        Convert JPG/PNG images to PDF in seconds
      </p>
      <div className="flex flex-col justify-center items-center">
        <button className="relative w-full">
          <label
            className=" lg:text-2xl text-lg text-white lg:px-28 px-12 bg-red-500 py-4 rounded-2xl hover:shadow-lg hover:shadow-red-200 hover:cursor-pointer"
            htmlFor="upload"
          >
            Select Images/PDF Files
          </label>
          <input
            id="upload"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="absolute z-[-1] top-0 left-0 w-full text-6xl"
            multiple
            onChange={(e) => onFileUpload(e.target.files)}
          />
        </button>

        <ul className="w-full lg:my-6 my-4 font-light lg:text-md text-sm">
          {fileList.length > 0 &&
            Object.keys(fileList).map((key: string) => (
              <li
                className="text-start lg:w-[460px] w-[280px] text-ellipsis overflow-hidden"
                key={key}
              >
                {fileList[parseInt(key)].name}
              </li>
            ))}
          {fileList.length === 0 && (
            <li className="text-start">No file uploaded. yet.</li>
          )}
        </ul>

        <button
          className="w-full bg-red-500 py-4 rounded-2xl lg:text-2xl text-lg text-white hover:cursor-pointer hover:shadow-lg hover:shadow-red-200"
          onClick={downloadPdf}
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}
