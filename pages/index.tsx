import PDFMerger from "../components/pdfmerger/components/PDFMerger/PDFMerger";
import { NextPage } from "next";
import Head from "next/head";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>QuickPDF - Merge PDFs and Images</title>
        <meta
          name="description"
          content="Introducing our serverless website for quick and secure merging of images and PDFs. Our process is quick and efficient and your files never leave your device, ensuring maximum security and privacy."
        />
      </Head>
      <div className="w-screen h-screen flex flex-row justify-center items-center lg:px-16 px-8 bg-white dark:bg-black">
        <PDFMerger />
      </div>
    </>
  );
};

export default Home;
