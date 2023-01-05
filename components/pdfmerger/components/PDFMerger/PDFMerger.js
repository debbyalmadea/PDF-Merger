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
    const pdfBytes = await pdf.save();
    download(
      pdfBytes,
      "pdf-lib_image_embedding_example.pdf",
      "application/pdf"
    );
  }

  async function addFirstMockImage() {
    const jpgUrl = "https://pdf-lib.js.org/assets/cat_riding_unicorn.jpg";
    const jpgImageBytes = await fetch(jpgUrl).then((res) => res.arrayBuffer());

    await addImage(jpgImageBytes, "jpg");
  }

  async function addSecondMockImage() {
    const pngUrl = "https://pdf-lib.js.org/assets/minions_banana_alpha.png";
    const pngImageBytes = await fetch(pngUrl).then((res) => res.arrayBuffer());

    await addImage(pngImageBytes, "png");
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
        if (fileType === "jpeg") {
          addImage(reader.result, "jpg");
        } else if (fileType === "png") {
          addImage(reader.result, "png");
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
      <p className="lg:text-2xl text-lg text-center my-4">
        Convert JPG/PNG images to PDF in seconds
      </p>
      <div className="flex flex-col justify-center items-center">
        <button className="relative w-full bg-red-500 py-4 rounded-2xl">
          <label
            className="text-center lg:text-2xl text-lg text-white w-full"
            htmlFor="upload"
          >
            Upload JPG/PNG Files
          </label>
          <input
            id="upload"
            type="file"
            className="absolute z-[-1] top-0 left-0"
            multiple
            onChange={(e) => onFileUpload(e.target.files)}
          />
        </button>

        <ul className="w-full my-2 font-light lg:text-md text-sm">
          {fileList.length > 0 &&
            Object.keys(fileList).map((key) => (
              <li className="text-start" key={key}>
                {fileList[key].name}
              </li>
            ))}
          {fileList.length === 0 && (
            <li className="text-start">No file uploaded. yet.</li>
          )}
        </ul>

        <button
          className="w-full bg-red-500 py-4 rounded-2xl lg:text-2xl text-lg text-white"
          onClick={downloadPdf}
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}
