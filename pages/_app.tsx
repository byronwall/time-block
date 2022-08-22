import "../styles/globals.css";

import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import "@blueprintjs/select/lib/css/blueprint-select.css";
import "@blueprintjs/datetime/lib/css/blueprint-datetime.css";

import Link from "next/link";
import { H1 } from "@blueprintjs/core";

function MyApp({ Component, pageProps }) {
  return (
    <div style={{ width: 800, margin: "auto", marginTop: 5 }}>
      <Link href="/">
        <H1 style={{ cursor: "pointer" }}>Time Block Schedule</H1>
      </Link>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
