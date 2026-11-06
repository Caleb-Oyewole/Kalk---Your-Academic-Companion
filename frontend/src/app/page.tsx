import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Arrow, Bird, Cloud, CloudOutline, Wings } from "@/components/Doodles";

const GRADES: [string, string, string][] = [
  ["A", "70 – 100", "5"],
  ["B", "60 – 69", "4"],
  ["C", "50 – 59", "3"],
  ["D", "45 – 49", "2"],
  ["E", "40 – 44", "1"],
  ["F", "0 – 39", "0"],
];

export default function Landing() {
  return (
    <main>
      <section className="hero">
        <div className="wrap">
          <nav className="nav" aria-label="Main">
            <Logo />
            <div className="nav-links">
              <a href="#how">How it works</a>
              <a href="#features">Features</a>
              <a href="#scale">Grading scale</a>
            </div>
            <div className="nav-right">
              <Link href="/login" className="nav-login">Log in</Link>
              <Link href="/signup" className="btn btn-outline">Get started</Link>
            </div>
          </nav>

          <h1 className="display hero-title">
            Your CGPA,<br />sorted.
          </h1>

          <div className="hero-stage">
            <CloudOutline className="cloud-o c1" />
            <CloudOutline className="cloud-o c2" />
            <CloudOutline className="cloud-o c3" />
            <Cloud className="hero-cloud" />
            <Wings className="wing wing-l" />
            <Wings className="wing wing-r" />

            <div className="transcript" aria-label="Example result sheet">
              <div className="transcript-head"><b>Result sheet</b><span>2023/2024 · First</span></div>
              <div className="t-row"><div><span className="code">CSC 201</span><span className="name">Computer Programming</span></div><span className="u">3u</span><span className="g">A</span></div>
              <div className="t-row"><div><span className="code">STA 211</span><span className="name">Engineering Statistics</span></div><span className="u">3u</span><span className="g">B</span></div>
              <div className="t-row"><div><span className="code">MTH 201</span><span className="name">Numerical Methods</span></div><span className="u">4u</span><span className="g">A</span></div>
              <div className="t-row off"><div><span className="code">GST 212</span><span className="name">Elective · excluded</span></div><span className="u">2u</span><span className="g">C</span></div>
              <div className="t-foot"><span>Semester GPA</span><strong>4.70</strong></div>
            </div>

            <div className="float float-a">
              <span className="ico">
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden><path d="M12 16V5m0 0-4 4m4-4 4 4M5 19h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              Upload a PDF or DOCX result in seconds.
            </div>
            <div className="float float-b">
              Leave out the electives
              <small>3 courses excluded</small>
              <div className="row">
                <span><span className="chip">GST 212</span><span className="chip">PHY 102</span><span className="chip">+1</span></span>
                <span className="minus">−6 units</span>
              </div>
            </div>

            <div className="float float-c">
              <Bird className="bird" />
              <div className="top">Current CGPA <span className="badge">First Class</span></div>
              <div className="big">4.62<small>/ 5.00</small></div>
              <div className="mini-card">
                <span className="lab">Semester GPA</span>
                <div className="foot"><span>•••• 4.70</span><span className="switch-vis" /></div>
              </div>
            </div>

            <Link href="/signup" className="pill-cta hero-cta">
              Get started <span className="dot"><Arrow /></span>
            </Link>
          </div>

          <p className="hero-sub">Drop in your results. We’ll do the maths.</p>
        </div>
      </section>

      <section id="how" className="section section-cream">
        <div className="wrap">
          <span className="eyebrow">How it works</span>
          <h2 className="display">Three steps.<br />Zero spreadsheets.</h2>
          <div className="steps">
            <div className="step"><div className="n">01</div><h3>Upload your result</h3><p>Drag in a PDF, DOCX, TXT or CSV result sheet — one semester or the whole degree.</p></div>
            <div className="step"><div className="n">02</div><h3>Review &amp; exclude</h3><p>Check what we read, fix anything flagged, and switch off electives or courses you don’t want counted.</p></div>
            <div className="step"><div className="n">03</div><h3>See your CGPA</h3><p>Your CGPA, class of degree and every semester’s GPA update instantly as you toggle courses.</p></div>
          </div>
        </div>
      </section>

      <section id="features" className="section">
        <div className="wrap">
          <span className="eyebrow">Features</span>
          <h2 className="display">Built for real<br />result sheets.</h2>
          <div className="features">
            <div className="feature"><div><span className="tag">Upload</span><h3>PDF, DOCX &amp; more</h3></div><p>Reads tables and plain text, finds course codes, units, scores and grades.</p></div>
            <div className="feature orange"><div><span className="tag">Control</span><h3>Exclude any course</h3></div><p>Toggle electives off one by one, or select a whole prefix like GST in one go.</p></div>
            <div className="feature blue"><div><span className="tag">Insight</span><h3>Per-semester GPA</h3></div><p>See how each session and semester contributed to your cumulative score.</p></div>
            <div className="feature light"><div><span className="tag">Accuracy</span><h3>Flagged for review</h3></div><p>Anything we weren’t sure about is marked so you can correct it before it counts.</p></div>
            <div className="feature"><div><span className="tag">Scale</span><h3>5.0 grading</h3></div><p>A–F on the Nigerian 5-point scale, with your class of degree worked out for you.</p></div>
            <div className="feature orange"><div><span className="tag">Private</span><h3>Your account only</h3></div><p>Sign in with email or Google. Your courses are visible only to you.</p></div>
          </div>
        </div>
      </section>

      <section id="scale" className="section section-cream">
        <div className="wrap scale">
          <div>
            <span className="eyebrow">Grading scale</span>
            <h2 className="display">The 5.0<br />scale.</h2>
            <p className="section-lede">CGPA is the sum of (credit units × grade points) divided by total credit units. First Class starts at 4.50, Second Class Upper at 3.50, Second Class Lower at 2.40.</p>
          </div>
          <div className="scale-table" role="table" aria-label="Grade points">
            {GRADES.map(([g, range, pt]) => (
              <div className="scale-row" role="row" key={g}>
                <span className="gr">{g}</span><span>{range} marks</span><span className="pt">{pt} pts</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="cta-band">
          <h2 className="display">Know your <em>number</em>.</h2>
          <p>Create a free account and get your CGPA in under a minute.</p>
          <Link href="/signup" className="pill-cta">Get started <span className="dot"><Arrow /></span></Link>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap">
          <Logo />
          <span>© {new Date().getFullYear()} Kalk. Always confirm your official CGPA with your department.</span>
        </div>
      </footer>
    </main>
  );
}
