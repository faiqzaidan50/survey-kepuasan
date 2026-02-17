import "./globals.css";
import Link from "next/link";
import PageTransition from "./page-transition";

export const metadata = {
  title: "Survey Kepuasan",
  description: "Survey Kepuasan Pelayanan — cepat, anonim, real-time",
  applicationName: "Survey Kepuasan",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        {/* background blobs + heartbeat */}
        <div className="bg" aria-hidden>
          <div className="blob a" />
          <div className="blob b" />
          <div className="blob c" />
          <div className="gridLines" />
          <HeartbeatLine />
        </div>

        <div className="appShell">
          <Topbar />

          {/* ✅ smooth transition wrapper */}
          <main className="main">
            <PageTransition>{children}</PageTransition>
          </main>

          <footer className="footer">
            © {new Date().getFullYear()} Survey Kepuasan Pelayanan — internal use
          </footer>
        </div>
      </body>
    </html>
  );
}

function Topbar() {
  return (
    <header className="topbar">
      <Link href="/" className="brand" aria-label="Kembali ke Home">
        <HospitalLogo />
        <div className="brandText">
          <div className="brandTitle">Survey Kepuasan Pelayanan</div>
          <div className="brandSub">Cepat • Anonim • Real-time</div>
        </div>
      </Link>

      <nav className="navPill" aria-label="Navigation">
        <Link className="navBtn" href="/survey">
          Survey
        </Link>
        <Link className="navBtn" href="/results">
          Results
        </Link>
        <Link className="navBtn" href="/charts">
          Charts
        </Link>
      </nav>
    </header>
  );
}

/** Logo animasi lucu: gedung + ambulans jalan + lampu kedip */
function HospitalLogo() {
  return (
    <div className="hlogo" aria-hidden>
      <div className="hlogoBg" />
      <div className="hBuilding">
        <div className="hBuildingTop">HOSPITAL</div>
        <div className="hWindows">
          <span className="hWin" />
          <span className="hWin" />
          <span className="hWin" />
        </div>
        <div className="hWindows">
          <span className="hWin" />
          <span className="hWin" />
          <span className="hWin" />
        </div>
        <div className="hDoor" />
        <div className="hCross">✚</div>
      </div>

      <div className="hAmbulance">
        <div className="hStripe" />
        <div className="hGlass" />
        <div className="hWheel w1" />
        <div className="hWheel w2" />
        <div className="hSirene" />
      </div>

      <div className="hCloud" />
    </div>
  );
}

/** Heartbeat line animasi di background */
function HeartbeatLine() {
  return (
    <svg className="heartbeat" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden>
      <path
        className="hbGlow"
        d="M0,70 L180,70 L210,70 L230,35 L260,100 L290,55 L310,70 L420,70 L520,70 L540,40 L565,98 L590,58 L610,70 L760,70 L820,70 L845,45 L870,92 L895,60 L920,70 L1200,70"
      />
      <path
        className="hbLine"
        d="M0,70 L180,70 L210,70 L230,35 L260,100 L290,55 L310,70 L420,70 L520,70 L540,40 L565,98 L590,58 L610,70 L760,70 L820,70 L845,45 L870,92 L895,60 L920,70 L1200,70"
      />
    </svg>
  );
}
  

