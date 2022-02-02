import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import download from "downloadjs"

export default function PDFMerger() {
  const [pdf, setPdf] = useState(null)

  useEffect(() => {
    async function initPdf() {
      const pdfDoc = await PDFDocument.create()
      const jpgUrl = 'https://pdf-lib.js.org/assets/cat_riding_unicorn.jpg'
      const jpgImageBytes = await fetch(jpgUrl).then((res) => res.arrayBuffer())

      // Fetch PNG image
      const pngUrl = 'https://pdf-lib.js.org/assets/minions_banana_alpha.png'
      const pngImageBytes = await fetch(pngUrl).then((res) => res.arrayBuffer())

      // Embed the JPG image bytes and PNG image bytes
      const jpgImage = await pdfDoc.embedJpg(jpgImageBytes)
      const pngImage = await pdfDoc.embedPng(pngImageBytes)

      // Get the width/height of the JPG image scaled down to 25% of its original size
      const jpgDims = jpgImage.scale(0.25)

      // Get the width/height of the PNG image scaled down to 50% of its original size
      const pngDims = pngImage.scale(0.5)

      // Add a blank page to the document
      const page = pdfDoc.addPage()

      // Draw the JPG image in the center of the page
      page.drawImage(jpgImage, {
        x: page.getWidth() / 2 - jpgDims.width / 2,
        y: page.getHeight() / 2 - jpgDims.height / 2,
        width: jpgDims.width,
        height: jpgDims.height,
      })

      // Draw the PNG image near the lower right corner of the JPG image
      page.drawImage(pngImage, {
        x: page.getWidth() / 2 - pngDims.width / 2 + 75,
        y: page.getHeight() / 2 - pngDims.height,
        width: pngDims.width,
        height: pngDims.height,
      })

      setPdf(pdfDoc)
    }
    initPdf().then(r => {
      console.log('init pdf successfully')
    })
  }, [])

  async function downloadPdf() {
    if (pdf == null) {
      console.log('pdf is not initiated')
      return
    }
    const pdfBytes = await pdf.save()
    download(pdfBytes, "pdf-lib_image_embedding_example.pdf", "application/pdf");
  }

  return (
    <button className="bg-black text-white rounded-md p-4" onClick={downloadPdf}>Download PDF</button>
  )
}
