import PDFMerger from "../components/pdfmerger/components/PDFMerger/PDFMerger";
import { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="w-screen h-screen flex flex-row justify-center items-center lg:px-16 px-8">
      <PDFMerger />
    </div>
  );
};

export default Home;
