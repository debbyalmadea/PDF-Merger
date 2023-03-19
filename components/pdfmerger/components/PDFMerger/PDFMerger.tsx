import { useEffect, useState } from "react";
import { PDFDocument, PageSizes, PDFPage } from "pdf-lib";
import download from "downloadjs";
import Image from "next/image";

enum ImageFormats {
  PNG,
  JPG,
}

enum FileOrientation {
  Potrait,
  Landscape,
}

type pdfPromise =
  | Promise<typeof PDFPage | undefined>
  | Promise<PDFPage[] | undefined>;

export default function PDFMerger() {
  const [pdf, setPdf] = useState<null | PDFDocument>(null);
  const [fileList, setFileList] = useState<[] | FileList>([]);
  const [fileData, setFileData] = useState<
    [] | { file: File; buffer: ArrayBuffer | string }[]
  >([]);
  const [pageSize, setPageSize] = useState<string>("A4");
  const [orientation, setOrientation] = useState(FileOrientation.Potrait);
  const [fileName, setFileName] = useState<string>("");

  useEffect(() => {
    async function initPdf() {
      const pdfDoc = await PDFDocument.create();
      setPdf(pdfDoc);
    }

    initPdf().then((r) => {
      console.log("init pdf successfully");
    });

    console.log(window.matchMedia("(prefers-color-scheme: dark)"));
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
      let pageW, pageH;
      if (pageSize === "Fit") {
        pageW = image.width;
        pageH = image.height;
      } else {
        if (orientation === FileOrientation.Potrait) {
          pageW = PageSizes[pageSize as keyof typeof PageSizes][0];
          pageH = PageSizes[pageSize as keyof typeof PageSizes][1];
        } else {
          pageW = PageSizes[pageSize as keyof typeof PageSizes][1];
          pageH = PageSizes[pageSize as keyof typeof PageSizes][0];
        }
      }
      const dims = image.scaleToFit(pageW, pageH);
      const page = pdf.addPage([pageW, pageH]);
      page.drawImage(image, {
        x: pageW / 2 - dims.width / 2,
        y: pageH / 2 - dims.height / 2,
        width: dims.width,
        height: dims.height,
      });

      return PDFPage;
    } else {
      console.log("failed to get image");
    }
  }

  async function addPdf(pdfByte: string | ArrayBuffer) {
    const newPDF = await PDFDocument.load(pdfByte);
    if (pdf) {
      const copiedPages = await pdf.copyPages(newPDF, newPDF.getPageIndices());
      copiedPages.forEach((page) => {
        pdf.addPage(page);
        console.log("added page");
      });

      return copiedPages;
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
    let promises: pdfPromise[] = [];
    console.log(fileData);
    console.log(pageSize);

    Array.from(fileData).forEach((data) => {
      const fileType = data.file.type;
      if (fileType === "image/jpeg") {
        promises.push(addImage(data.buffer, ImageFormats.JPG));
      } else if (fileType === "image/png") {
        promises.push(addImage(data.buffer, ImageFormats.PNG));
      } else if (fileType === "application/pdf") {
        console.log("embedding pdf");
        promises.push(addPdf(data.buffer));
      }
    });

    await Promise.all(promises);
    const pdfBytes = await pdf.save();
    console.log("download", pdfBytes);
    download(pdfBytes, fileName + ".pdf", "application/pdf");

    await resetPDF();
  }

  async function onFileUpload(input: FileList | null) {
    if (!input) {
      return console.log("no file input");
    }
    let fileDataArray: { file: File; buffer: ArrayBuffer | string }[] = [];
    setFileList(input);
    console.log(input);

    Array.from(input).forEach((file) => {
      const reader = new FileReader();
      reader.onerror = () => {
        console.error("failed to read file to buffer", file, reader.error);
      };

      reader.onload = () => {
        if (reader.result == null) {
          console.error("file result is null", file, reader.error);
          return;
        }
        fileDataArray.push({ file: file, buffer: reader.result });

        console.info("successfully read file", file);
      };

      reader.readAsArrayBuffer(file);
    });

    setFileData(fileDataArray);
    setFileName(input[0].name.replace(/\.[^\/.]+$/, ""));
  }

  async function resetPDF() {
    setFileList([]);
    const pdfDoc = await PDFDocument.create();
    setPdf(pdfDoc);
  }

  return (
    <div className="flex flex-col justify-center items-center text-black dark:text-white">
      <div className="flex flex-row items-center space-x-2 sm:space-x-4 justify-center">
        <div className="w-[40px] sm:w-[75px] h-[40px] sm:h-[75px] relative">
          <Image src={"/icon.png"} alt="logo" fill />
        </div>
        <h1 className="sm:text-8xl text-5xl font-extrabold text-center">
          QuickPDF
        </h1>
      </div>
      <p className="sm:text-2xl text-lg text-center mt-4 mb-8">
        Merge PDFs and Images quickly and securely
      </p>
      <div className="flex flex-col justify-center items-center w-[320px] sm:w-[560px]">
        <button className="relative w-full">
          <label
            className="block sm:text-2xl text-lg text-white  w-full bg-red-600  py-4 rounded-2xl hover:shadow-lg hover:shadow-red-500  hover:cursor-pointer"
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
                className="text-start w-full text-ellipsis overflow-hidden"
                key={key}
              >
                {fileList[parseInt(key)].name}
              </li>
            ))}
          {fileList.length === 0 && (
            <li className="text-start">No file uploaded. yet.</li>
          )}
        </ul>

        <div className="flex flex-row space-x-4">
          <label htmlFor="page-size" className="sm:text-lg text-md">
            Page size:
          </label>
          <select
            name="page-size"
            id="page-size"
            onChange={(e) => {
              setPageSize(e.target.value);
            }}
            className="sm:text-lg text-md bg-transparent"
          >
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
            <option value="Legal">Legal</option>
            <option value="Fit">Fit Image</option>
          </select>
        </div>

        <div className="flex flex-row space-x-4 mt-4 sm:text-lg text-md">
          <button
            className={`border-2 w-40 h-20 rounded-lg hover:rounded-xl hover:bg-red-100 hover:border-red-600 hover:text-red-600 ${
              orientation === FileOrientation.Potrait &&
              "border-red-600 text-red-600"
            }`}
            onClick={() => setOrientation(FileOrientation.Potrait)}
          >
            Potrait
          </button>
          <button
            className={`border-2 w-40 h-20 rounded-lg hover:rounded-xl hover:bg-red-100 hover:border-red-600 hover:text-red-600  ${
              orientation === FileOrientation.Landscape &&
              "border-red-600 text-red-600"
            }`}
            onClick={() => setOrientation(FileOrientation.Landscape)}
          >
            Landscape
          </button>
        </div>

        {fileList.length > 0 && (
          <div className="flex flex-col justify-start w-full my-8">
            <div className="flex flex-row space-x-4 items-center">
              <label>File name</label>
              <input
                className="border-2 grow rounded-xl px-4 py-2"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
            </div>
            <button
              className="mt-8 w-full bg-red-600 py-4 rounded-2xl lg:text-2xl text-lg text-white hover:cursor-pointer hover:shadow-lg hover:shadow-red-500"
              onClick={downloadPdf}
            >
              Download PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
