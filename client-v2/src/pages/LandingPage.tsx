import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Button } from "../components/ui/Button";
import {
  ArrowRight, BarChart3, Check, FileText, Link2,
  MessageSquare, Sparkles, Zap, ClipboardList, CalendarCheck,
} from "lucide-react";
import "./LandingPage.css";

const FEATURES = [
  { icon: FileText, title: "Automated Backlog Generation", description: "Upload a PRD or paste requirements and get a complete backlog with detailed descriptions, acceptance criteria, priorities, and story point estimates—ready for your team to review." },
  { icon: Link2, title: "Direct Jira Integration", description: "Connect your Atlassian account and push approved epics, stories, and subtasks straight to your Jira board. The structure you build here maps directly to Jira." },
  { icon: MessageSquare, title: "Chat with Parallel Assistant", description: "Brainstorm and plan backlogs in conversation. The assistant has full context from your uploaded documents and Jira data to craft individual stories on the fly." },
  { icon: ClipboardList, title: "Context-Aware Planning", description: "Your uploaded business documents, PRDs, and live Jira tickets give the assistant real context—so generated backlogs actually match your product, not a generic template." },
  { icon: BarChart3, title: "Sprint & Standup Reports", description: "Get daily standup summaries, weekly progress reports, and sprint retrospective insights pulled directly from your Jira board data and sprint history." },
  { icon: CalendarCheck, title: "Craft Backlogs On The Go", description: "Need a quick story or sub-task? Chat with the assistant to generate individual backlog items with full acceptance criteria and estimates without running a full PRD pipeline." },
];

const STEPS = [
  { number: "01", title: "Upload your requirements", description: "Paste a PRD, upload a PDF, or describe what you want to build in plain text." },
  { number: "02", title: "Review the generated backlog", description: "Parallel Agile Assistant produces epics, stories with acceptance criteria, priorities, and story points for your review." },
  { number: "03", title: "Push to Jira & start your sprint", description: "Approve the backlog, push it to Jira, and use reports to track your team's progress." },
];

/** Hook: IntersectionObserver-based scroll reveal */
function useScrollReveal() {
  const refs = useRef<(HTMLElement | null)[]>([]);

  const setRef = useCallback((index: number) => (el: HTMLElement | null) => {
    refs.current[index] = el;
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    refs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  return setRef;
}

export function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const setRef = useScrollReveal();

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-orb landing-orb-one" />
        <div className="landing-orb landing-orb-two" />
        <div className="landing-container landing-hero-layout">
          <div className="landing-hero-copy">
            <div className="landing-hero-badge"><Sparkles size={15} /> AI-powered agile planning</div>
            <h1>Ship faster with <span className="landing-product-name">Parallel Agile Assistant.</span></h1>
            <p>Generate complete backlogs with acceptance criteria, story points, and priorities from any PRD—then push straight to Jira.</p>
            <div className="landing-hero-actions">
              <Button size="lg" onClick={() => navigate("/prd")}>Generate a Backlog <ArrowRight size={18} /></Button>
              <Button size="lg" variant="secondary" onClick={() => navigate("/docs")}>See how it works</Button>
            </div>
            <div className="landing-trust"><Check size={16} /> Start free. Review everything. Connect Jira when you are ready.</div>
          </div>
          <div className="landing-product-preview" aria-label="Example Parallel Agile Assistant backlog preview">
            <div className="preview-topbar"><span className="preview-logo"><Zap size={15} /> Parallel Agile Assistant</span><span className="preview-status">Draft ready</span></div>
            <div className="preview-body">
              <p className="preview-kicker">SPRINT PLAN · Q3 ONBOARDING</p>
              <h2>Welcome new customers with confidence</h2>
              <div className="preview-progress"><span /><span /><span /></div>
              <div className="preview-card"><span className="preview-dot blue" /><div><strong>First-run experience</strong><small>3 stories · P1 · Ready for review</small></div><span className="preview-points">8 pts</span></div>
              <div className="preview-card"><span className="preview-dot sky" /><div><strong>Invite your team</strong><small>2 stories · P2 · Acceptance criteria included</small></div><span className="preview-points">5 pts</span></div>
              <div className="preview-card preview-card-muted"><span className="preview-dot green" /><div><strong>Measure activation</strong><small>1 story · P3 · Suggested next step</small></div><span className="preview-plus">+</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-value-section">
        <div className="landing-container">
          <div className="landing-section-heading landing-reveal" ref={setRef(0)}><span className="landing-eyebrow">WHAT PARALLEL AGILE ASSISTANT DOES</span><h2>From requirements to Jira-ready backlogs in minutes.</h2><p>Automate the grunt work of backlog creation so your team can focus on building the right thing.</p></div>
          <div className="landing-features-grid landing-reveal" ref={setRef(1)}>
            {FEATURES.map((feature) => <article key={feature.title} className="landing-feature-card"><div className="landing-feature-icon"><feature.icon size={22} /></div><h3>{feature.title}</h3><p>{feature.description}</p><span className="landing-feature-link">Learn more <ArrowRight size={14} /></span></article>)}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt">
        <div className="landing-container">
          <div className="landing-section-heading landing-reveal" ref={setRef(2)}><span className="landing-eyebrow">HOW IT WORKS</span><h2>Three steps from PRD to sprint-ready backlog.</h2><p>You stay in control at every step. The AI generates, you review and approve.</p></div>
          <div className="landing-steps landing-reveal" ref={setRef(3)}>{STEPS.map((step) => <article key={step.number} className="landing-step"><span className="landing-step-number">{step.number}</span><h3>{step.title}</h3><p>{step.description}</p></article>)}</div>
        </div>
      </section>

      <section className="landing-section landing-proof-section">
        <div className="landing-container landing-proof landing-reveal" ref={setRef(4)}><div><span className="landing-eyebrow" style={{ color: '#93c5fd' }}>BUILT FOR REAL TEAMS</span><h2>Everything you need for agile planning in one place.</h2></div><div className="landing-proof-list"><span><Check /> Automated backlog generation with acceptance criteria &amp; story points</span><span><Check /> Direct Jira push — epics, stories, and subtasks</span><span><Check /> Chat assistant with context from your docs and Jira</span><span><Check /> Daily standup, weekly, and retrospective reports</span></div></div>
      </section>

      <section className="landing-cta"><div className="landing-container"><span className="landing-eyebrow landing-eyebrow-light">START PLANNING SMARTER</span><h2>Generate your first backlog in under 2 minutes.</h2><p>Upload a PRD, review the output, and push to Jira — all with Parallel Agile Assistant.</p><div className="landing-hero-actions"><Button size="lg" onClick={() => navigate("/prd")}>Start planning free <ArrowRight size={18} /></Button>{!isAuthenticated && <Button size="lg" variant="secondary" onClick={() => navigate("/login")}>Connect with Jira</Button>}</div></div></section>

      <footer className="landing-footer"><div className="landing-container landing-footer-inner"><span><Zap size={16} /> Parallel Agile Assistant</span><p>AI-powered backlog generation for agile teams.</p><div className="landing-footer-links"><button onClick={() => navigate("/docs")}>Docs</button><button onClick={() => navigate("/prd")}>Start planning</button>{!isAuthenticated && <button onClick={() => navigate("/login")}>Sign in</button>}</div></div></footer>
    </div>
  );
}
