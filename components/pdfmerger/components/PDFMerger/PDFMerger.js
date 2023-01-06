import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import download from "downloadjs";
import { image } from "tailwindcss/lib/util/dataTypes";

export default function PDFMerger() {
  const [pdf, setPdf] = useState(null);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    async function initPdf() {
      const pdfDoc = await PDFDocument.create();
      setPdf(pdfDoc);
    }

    initPdf().then((r) => {
      console.log("init pdf successfully");
    });
  }, []);

  async function addImage(imageBytes, type) {
    if (pdf == null) {
      console.log("pdf is not init");
      return;
    }

    let image;
    switch (type) {
      case "jpg":
        image = await getJpgImage(imageBytes);
        break;
      case "png":
        image = await getPngImage(imageBytes);
        break;
      default:
        return;
    }

    const dims = image.scale(1);
    const page = pdf.addPage();
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: dims.width,
      height: dims.height,
    });
  }

  async function addPdf(pdfByte) {
    const newPDF = await PDFDocument.load(pdfByte);
    const copiedPages = await pdf.copyPages(newPDF, newPDF.getPageIndices());
    copiedPages.forEach((page) => pdf.addPage(page));
  }

  async function getJpgImage(imageBytes) {
    if (pdf == null) {
      console.log("pdf not init");
      return;
    }

    return await pdf.embedJpg(imageBytes);
  }

  async function getPngImage(imageBytes) {
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
  }
  async function onFileUpload(input) {
    setFileList(input);
    console.log(input);

    Array.from(input).forEach((file) => {
      const reader = new FileReader();
      const fileType = file.type.replace("image/", "");

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
          addImage(reader.result, "jpg");
        } else if (fileType === "image/png") {
          addImage(reader.result, "png");
        } else if (fileType === "application/pdf") {
          addPdf(reader.result);
        }

        console.info("successfully embed file to pdf", file);
      };

      reader.readAsArrayBuffer(file);
    });
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
            className=" lg:text-2xl text-lg text-white lg:px-32 px-[55px] bg-red-500 py-4 rounded-2xl hover:shadow-lg hover:shadow-red-200 hover:cursor-pointer"
            htmlFor="upload"
          >
            Upload JPG/PNG Files
          </label>
          <input
            id="upload"
            type="file"
            className="absolute z-[-1] top-0 left-0 w-full text-6xl"
            multiple
            onChange={(e) => onFileUpload(e.target.files)}
          />
        </button>

        <ul className="w-full lg:my-6 my-4 font-light lg:text-md text-sm">
          {fileList.length > 0 &&
            Object.keys(fileList).map((key) => (
              <li
                className="text-start lg:w-[460px] w-[240px] text-ellipsis overflow-hidden"
                key={key}
              >
                {fileList[key].name}
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
