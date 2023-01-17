import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta name="theme-color" content="#dc2626" />
        <meta
          name="description"
          content="Introducing our serverless website for quick and secure merging of images and PDFs. Our process is quick and efficient and your files never leave your device, ensuring maximum security and privacy."
        />
        <meta
          name="keywords"
          content="merging, images, pdfs, serverless, quick, efficient, secure, privacy, files, device, merge, combine, server-free, server-less, merging images and pdfs, merging pdfs, merging files, secure merging, quick merge, efficient merge, merge without server, serverless merge, merging without server, secure merging without server, serverless file merging, merge files without server, serverless pdf and image merging, merge pdf and images, merge pdfs and images, merge pdfs and images without server, serverless pdf merge, serverless image merge, mergeing, server-less merging, pdf and image merge, merge pdf & images, mergeing pdfs and images, serverless merging service, merge files serverless, merge pdf and image, merging files without a server, merging pdfs and images serverless, merging pdf and images, mergeing pdf & images."
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
