import { useEffect, useState } from "react";
import { PDFDocument, PageSizes, PDFPage } from "pdf-lib";
import download from "downloadjs";
import Image from "next/image";
import DraggableList from "../../../common/DraggableList";

enum ImageFormats {
  PNG,
  JPG,
}

enum FileOrientation {
  Potrait,
  Landscape,
}

export default function PDFMerger() {
  const [pdf, setPdf] = useState<null | PDFDocument>(null);
  const [fileList, setFileList] = useState<[] | Array<File>>([]);
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
  }, []);

  async function insertImage(
    index: number,
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
      index = getNewPageIndex(index);
      const page = pdf.insertPage(index, [pageW, pageH]);

      page.drawImage(image, {
        x: pageW / 2 - dims.width / 2,
        y: pageH / 2 - dims.height / 2,
        width: dims.width,
        height: dims.height,
      });

      return page;
    } else {
      console.log("failed to get image");
    }
  }

  function scaleToFitPage(page: PDFPage) {
    let pageW, pageH;
    if (pageSize === "Fit") {
      pageW = page.getWidth();
      pageH = page.getHeight();
    } else {
      if (orientation === FileOrientation.Potrait) {
        pageW = PageSizes[pageSize as keyof typeof PageSizes][0];
        pageH = PageSizes[pageSize as keyof typeof PageSizes][1];
      } else {
        pageW = PageSizes[pageSize as keyof typeof PageSizes][1];
        pageH = PageSizes[pageSize as keyof typeof PageSizes][0];
      }
    }
    let scaleW = (pageW / page.getWidth()) * 1.0;
    let scaleH = (pageH / page.getHeight()) * 1.0;

    if (scaleW < scaleH) {
      let newH = (page.getHeight() / page.getWidth()) * pageW;
      scaleH = (newH / page.getHeight()) * 1.0;
    } else {
      let newW = (page.getWidth() / page.getHeight()) * pageH;
      scaleW = (newW / page.getWidth()) * 1.0;
    }

    page.scale(scaleW, scaleH);
    page.setMediaBox(
      -(pageW / 2 - page.getWidth() / 2),
      -(pageH / 2 - page.getHeight() / 2),
      pageW,
      pageH
    );

    return page;
  }

  async function insertPdf(index: number, pdfByte: string | ArrayBuffer) {
    const newPDF = await PDFDocument.load(pdfByte);
    if (pdf) {
      const copiedPages = await pdf.copyPages(newPDF, newPDF.getPageIndices());
      index = getNewPageIndex(index);

      copiedPages.forEach((page) => {
        page = scaleToFitPage(page);
        pdf.insertPage(index, page);
        index++;
      });

      return copiedPages;
    } else {
      console.log("pdf not init");
    }
  }

  /**
   *
   * @param index index of file in file list
   * @returns new starting index of the file in pdf
   */
  function getNewPageIndex(index: number) {
    if (pdf) {
      while (index > pdf.getPageCount()) {
        pdf.addPage([1, 1]); // mark as temporary pages
      }

      // get the new starting index of the file in pdf
      while (
        index < pdf.getPageCount() &&
        pdf.getPage(index).getSize().width > 1 && // if it's not temporary pages
        pdf.getPage(index).getSize().height > 1
      ) {
        index++;
        console.log("increment index to", index);
      }

      // if the actual starting index are used by temporary pages
      if (
        index < pdf.getPageCount() &&
        pdf.getPage(index).getSize().width == 1 &&
        pdf.getPage(index).getSize().height == 1
      ) {
        console.log("removing page", index);
        pdf.removePage(index);
      }

      return index;
    } else {
      console.log("pdf not init");
      return -1;
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
    console.log(pageSize);

    const fileDataArray: { file: File; buffer: ArrayBuffer | string }[] =
      await readFile();

    console.log(fileDataArray);

    const pdfPagesArray: Array<PDFPage | PDFPage[] | undefined> =
      await addPages(fileDataArray);

    if (pdfPagesArray.length > 0) {
      const pdfBytes = await pdf.save();
      console.log("download", pdfBytes);
      download(pdfBytes, fileName + ".pdf", "application/pdf");
      await resetPDF();
    }
  }

  /**
   *
   * @param fileDataArray array of file data
   * @returns pdf pages
   */
  function addPages(
    fileDataArray: { file: File; buffer: ArrayBuffer | string }[]
  ): Promise<Array<PDFPage | undefined | PDFPage[]>> {
    return new Promise((resolve, reject) => {
      let pdfPages: Array<PDFPage | undefined | PDFPage[]> = [];

      Array.from(fileDataArray).forEach(async (data, index) => {
        const fileType = data.file.type;
        if (fileType === "image/jpeg") {
          console.log("embedding jpeg", data.file.name, index);
          const page = await insertImage(index, data.buffer, ImageFormats.JPG);
          pdfPages.push(page);
        } else if (fileType === "image/png") {
          console.log("embedding png", data.file.name, index);
          const page = await insertImage(index, data.buffer, ImageFormats.PNG);
          pdfPages.push(page);
        } else if (fileType === "application/pdf") {
          console.log("embedding pdf", data.file.name, index);
          const page = await insertPdf(index, data.buffer);
          pdfPages.push(page);
        }

        if (pdfPages.length == fileDataArray.length) {
          resolve(pdfPages);
        }
      });
    });
  }

  /**
   * convert array of file to array of file data
   * @returns array of file data
   */
  function readFile(): Promise<{ file: File; buffer: ArrayBuffer | string }[]> {
    console.log("file list", fileList);
    return new Promise((resolve, reject) => {
      let fileDataArray: { file: File; buffer: ArrayBuffer | string }[] = [];

      Array.from(fileList).forEach((file, index) => {
        console.log("reading", file.name);
        const reader = new FileReader();
        reader.onerror = () => {
          console.error("failed to read file to buffer", file, reader.error);
          reject();
        };

        reader.onload = () => {
          if (reader.result == null) {
            console.error("file result is null", file, reader.error);
            return;
          }

          if (fileDataArray[index] != null) {
            fileDataArray.splice(index, 0, {
              file: file,
              buffer: reader.result,
            });
          } else {
            fileDataArray.push({ file: file, buffer: reader.result });
          }
          console.info("successfully read file", file);

          if (fileDataArray.length == fileList.length) {
            resolve(fileDataArray);
          }
        };

        reader.readAsArrayBuffer(file);
      });
    });
  }

  function onFileUpload(input: FileList | null) {
    if (!input) {
      return console.log("no file input");
    }
    setFileList(Array.from(input));
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
            onClick={(e) => (e.currentTarget.value = "")}
          />
        </button>

        <ul className="w-full lg:my-6 my-4 font-light lg:text-md text-sm">
          {fileList.length > 0 && (
            <DraggableList fileList={fileList} setFileList={setFileList} />
          )}
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
            <option value="Fit">Fit</option>
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
