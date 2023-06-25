import "../styles/globals.css";
import { AppType } from "next/dist/shared/lib/utils";

const MyApp: AppType = ({
  Component,
  pageProps,
}: {
  Component: any;
  pageProps: any;
}) => {
  return <Component {...pageProps} />;
};

export default MyApp;
