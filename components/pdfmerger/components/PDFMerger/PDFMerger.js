import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import download from "downloadjs"
import { image } from "tailwindcss/lib/util/dataTypes";

export default function PDFMerger() {
  const [pdf, setPdf] = useState(null)

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

  return (
    <div className="flex flex-col space-y-2">
      <button className="bg-black text-white rounded-md p-4" onClick={addFirstMockImage}>Add JPG Image</button>
      <button className="bg-black text-white rounded-md p-4" onClick={addSecondMockImage}>Add PNG Image</button>
      <button className="bg-black text-white rounded-md p-4" onClick={downloadPdf}>Download PDF</button>
    </div>
  )
}
