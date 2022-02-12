import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import download from "downloadjs"
import { image } from "tailwindcss/lib/util/dataTypes";

export default function PDFMerger() {
  const [pdf, setPdf] = useState(null)
  const [fileList, setFileList] = useState([])

  useEffect(() => {
    async function initPdf() {
      const pdfDoc = await PDFDocument.create()
      setPdf(pdfDoc)
    }

    initPdf().then(r => {
      console.log('init pdf successfully')
    })
  }, [])

  async function addImage(imageBytes, type) {
    if (pdf == null) {
      console.log('pdf is not init')
      return
    }

    let image;
    switch (type) {
      case "jpg":
        image = await getJpgImage(imageBytes)
        break
      case "png":
        image = await getPngImage(imageBytes)
        break
      default:
        return
    }

    const dims = image.scale(1)
    const page = pdf.addPage()
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: dims.width,
      height: dims.height
    })
  }

  async function getJpgImage(imageBytes) {
    if (pdf == null) {
      console.log('pdf not init')
      return
    }

    return await pdf.embedJpg(imageBytes)
  }

  async function getPngImage(imageBytes) {
    if (pdf == null) {
      console.log('pdf not init')
      return
    }

    return await pdf.embedPng(imageBytes)
  }

  async function downloadPdf() {
    if (pdf == null) {
      console.log('pdf is not initiated')
      return
    }
    const pdfBytes = await pdf.save()
    download(pdfBytes, "pdf-lib_image_embedding_example.pdf", "application/pdf");
  }

  async function addFirstMockImage() {
    const jpgUrl = 'https://pdf-lib.js.org/assets/cat_riding_unicorn.jpg'
    const jpgImageBytes = await fetch(jpgUrl).then((res) => res.arrayBuffer())

    await addImage(jpgImageBytes, "jpg")
  }

  async function addSecondMockImage() {
    const pngUrl = 'https://pdf-lib.js.org/assets/minions_banana_alpha.png'
    const pngImageBytes = await fetch(pngUrl).then((res) => res.arrayBuffer())

    await addImage(pngImageBytes, "png")
  }

  async function onFileUpload(input) {
    setFileList(input)
    console.log(input)

    Array.from(input).forEach(file => {
      const reader = new FileReader()
      const fileType = file.type.replace("image/", "")

      reader.onerror = () => {
        console.error("failed to read file to buffer", file, reader.error)
      }

      reader.onload = () => {
        if (reader.result == null) {
          console.error("file result is null", file, reader.error)
          return
        }

        console.info("successfully read file", file)
        if (fileType === "jpeg") {
          addImage(reader.result, "jpg")
        } else if (fileType === "png") {
          addImage(reader.result, "png")
        }

        console.info("successfully embed file to pdf", file)
      }

      reader.readAsArrayBuffer(file)
    })
  }

  return (
    <div className="container">
      <h1 className="title">Merge PDF</h1>
      <h2 className="sub-title">Convert JPG/PNG images to PDF in seconds</h2>
      <div className="buttons">

        <form className="form">
          <label className="input-label" htmlFor="upload">Upload JPG/PNG Files</label>
          <input id="upload" type="file" className="input-file"
                 multiple
                 onChange={(e) => onFileUpload(e.target.files)}
          />
        </form>

        <ul className="uploaded-file-list">
          {fileList.length > 0 && (
            Object.keys(fileList).map((key) => (
              <li className="uploaded-file" key={key}>
                {fileList[key].name}
              </li>
            ))
          )}
          {fileList.length === 0 && (
            <li className="no-result">No file uploaded. yet.</li>
          )}
        </ul>

        <button className="download" onClick={downloadPdf}>Download PDF</button>
      </div>
    </div>
  )
}
