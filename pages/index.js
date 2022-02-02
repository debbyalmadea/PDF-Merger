import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import PDFMerger from "../components/pdfmerger/components/PDFMerger/PDFMerger";

export default function Home() {
  return (
    <div className="w-full h-screen flex flex-row justify-center items-center">
      <PDFMerger />
    </div>
  )
}
