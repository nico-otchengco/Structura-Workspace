import React, { useEffect } from 'react';
import "../../styles/style.css";

import {
  Building2,
  Users,
  BarChart3,
  FolderKanban,
  ShieldCheck,
  Cloud,
  LayoutDashboard,
  CheckCircle2,
  Bot,
  Code2,
  Braces,
  Database,
  Server,
  Palette,
  Sparkles
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

const techStack = [
  { icon: Code2, label: 'React' },
  { icon: Braces, label: 'TypeScript' },
  { icon: Server, label: 'Supabase' },
  { icon: Database, label: 'PostgreSQL' },
  { icon: ShieldCheck, label: 'Supabase Auth' },
  { icon: Palette, label: 'CSS' },
  { icon: Sparkles, label: 'Vercel' },
  { icon: Bot, label: 'Groq AI' },
];

export function LandingPage({ onGetStarted }: LandingPageProps) {

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('lp-visible'); }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.lp-reveal').forEach(el => observer.observe(el));

    const handleScroll = () => {
      const nav = document.getElementById('lp-nav');
      if (nav) nav.style.boxShadow = window.scrollY > 40 ? '0 4px 20px rgba(0,0,0,0.08)' : 'none';
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>

      <div className="lp-root">
        <nav className="lp-nav" id="lp-nav">
          <button className="lp-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {/* <div className="lp-logo-box">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="white"><path d="M2 2h5v5H2zm7 0h5v5H9zM2 9h5v5H2zm7 0h5v5H9z"/></svg>
            </div> */}
            Structura
          </button>
          <ul className="lp-nav-links">
            <li><a href="#lp-features">Features</a></li>
            <li><a href="#lp-how">Workflow</a></li>
            <li><a href="#lp-about">About</a></li>
            <li><a href="#lp-tech">Tech Stack</a></li>
          </ul>
          <button className="lp-nav-cta" onClick={onGetStarted}>Get Started →</button>
        </nav>

        <section className="lp-hero">
          <div className="lp-hero-bg">
            <div className="lp-hero-grid" />
            <div className="lp-orb-1" />
            <div className="lp-orb-2" />  
          </div>
          <div style={{ width: '100%', maxWidth: 900, position: 'relative', zIndex: 2 }}>
            <div className="lp-hero-content">
              <h1 className="lp-h1">Structura <span className="lp-accent">Workspace</span></h1>
              <p className="lp-sub">A Multi-Tenant Project Management System Built for Scalable Teams</p>
              <p className="lp-tagline">"Structure Your Work. Scale Your Teams."</p>
            </div>
            <div className="lp-hero-visual">
              <div className="lp-card">
                <div className="lp-card-bar">
                  <div className="lp-dot" style={{ background: '#ff5f57' }} />
                  <div className="lp-dot" style={{ background: '#febc2e' }} />
                  <div className="lp-dot" style={{ background: '#28c840' }} />
                  <span style={{ marginLeft: 12, fontSize: '0.75rem', color: '#999' }}>Structura Workspace — Sprint 1</span>
                </div>
                <div className="lp-card-body">
                  <div className="lp-mock-sidebar">
                    <div className="lp-mock-item active"><div className="lp-mock-dot" /> Boards</div>
                    <div className="lp-mock-item"><div className="lp-mock-dot" /> Calendar</div>
                    <div className="lp-mock-item"><div className="lp-mock-dot" /> Team</div>
                    <div className="lp-mock-item"><div className="lp-mock-dot" /> Activity</div>
                    <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #f0f0f0', fontSize: '0.72rem', color: '#999', fontWeight: 600, letterSpacing: '0.05em' }}>QUICK ACCESS</div>
                    <div className="lp-mock-item" style={{ fontSize: '0.78rem' }}>Sprint 1</div>
                    <div className="lp-mock-item" style={{ fontSize: '0.78rem' }}>Sprint 2</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0a0a0f', marginBottom: 12 }}>Sprint 1 Board</div>
                    <div className="lp-board-row">
                      <div className="lp-col">
                        <div className="lp-col-title">To Do</div>
                        <div className="lp-task high">Fix login button<div><span className="lp-tag red">High</span></div></div>
                        <div className="lp-task med">Update profile<div><span className="lp-tag yellow">Medium</span></div></div>
                      </div>
                      <div className="lp-col">
                        <div className="lp-col-title">In Progress</div>
                        <div className="lp-task med">API integration<div><span className="lp-tag yellow">Medium</span></div></div>
                        <div className="lp-task low">Unit tests<div><span className="lp-tag green">Low</span></div></div>
                      </div>
                      <div className="lp-col">
                        <div className="lp-col-title">Done</div>
                        <div className="lp-task low">Setup DB<div><span className="lp-tag green">Low</span></div></div>
                        <div className="lp-task low">Design mocks<div><span className="lp-tag green">Low</span></div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-value lp-section" id="lp-about">
          <div className="lp-value-inner lp-reveal">
            <div>
              <div className="lp-section-label">Why Structura?</div>
              <h2 className="lp-section-title">Built for Complex Team Structures</h2>
              <p className="lp-section-desc">Structura Workspace is designed to handle complex team structures with ease. Built using a multi-tenant architecture, it ensures secure, isolated environments for each organization while maintaining a seamless user experience.</p>
              <p className="lp-section-desc" style={{ marginTop: 16 }}>Whether you're managing a single team or multiple organizations, Structura keeps everything structured, accessible, and scalable.</p>
            </div>
            <div className="lp-stats">
              {[
                { num: '∞', sup: '+', label: 'Organizations Supported' },
                { num: '6', sup: '+', label: 'Core Features' },
                { num: '3', sup: 'x', label: 'Role-Based Access Levels' },
                { num: '100', sup: '%', label: 'Data Isolation per Tenant' },
              ].map((s, i) => (
                <div className={`lp-stat lp-reveal lp-d${i + 1}`} key={i}>
                  <div className="lp-stat-num">{s.num}<span>{s.sup}</span></div>
                  <div className="lp-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" id="lp-features" style={{ background: '#f5f4f0' }}>
          <div className="lp-reveal" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 64px' }}>
            <div className="lp-section-label">Features</div>
            <h2 className="lp-section-title">Everything Your Team Needs</h2>
            <p className="lp-section-desc" style={{ margin: '0 auto' }}>A complete toolkit for modern project management across multiple organizations.</p>
          </div>
          <div className="lp-features-grid">
            {[
              { icon: Building2, title: 'Multi-Tenant Architecture', desc: 'Manage multiple organizations within a single platform. Each tenant operates in its own secure and isolated environment.' },
              { icon: Users, title: 'Role-Based Access Control', desc: 'Assign roles and permissions to users. Control who can view, edit, and manage projects within each organization.' },
              { icon: BarChart3, title: 'Centralized Dashboard', desc: 'Get a clear overview of projects, tasks, and team performance across your entire workspace at a glance.' },
              { icon: FolderKanban, title: 'Project & Task Management', desc: 'Create, organize, and track projects with structured workflows, kanban boards, and task assignments.' },
              { icon: ShieldCheck, title: 'Secure Data Isolation', desc: 'Built with backend RLS policies that ensure complete data privacy and security between organizations.' },
              { icon: Cloud, title: 'Cloud-Based System', desc: 'Accessible anytime, anywhere with real-time updates and synchronization powered by Supabase.' },
            ].map((f, i) => (
              <div className={`lp-feature lp-reveal lp-d${(i % 3) + 1}`} key={i}>
                <div className="lp-feature-icon"><f.icon size={22} strokeWidth={1.5} /></div>
                <div className="lp-feature-title">{f.title}</div>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-section" id="lp-how" style={{ background: 'white' }}>
          <div className="lp-how-inner">
            <div className="lp-reveal">
              <div className="lp-section-label">How It Works</div>
              <h2 className="lp-section-title">Up and Running in Minutes</h2>
              <div>
                {[
                  { n: '01', title: 'Create an Organization', desc: 'Set up a workspace for your team or company. Each organization gets its own secure, isolated environment.' },
                  { n: '02', title: 'Invite Members', desc: 'Add users and assign roles based on responsibilities — owner, project manager, member, or client.' },
                  { n: '03', title: 'Manage Projects', desc: 'Create boards, assign tasks, set deadlines, and track progress with a visual kanban workflow.' },
                  { n: '04', title: 'Scale Seamlessly', desc: 'Add more organizations and manage everything from one platform as your team grows.' },
                ].map((s, i) => (
                  <div className="lp-step" key={i}>
                    <div className="lp-step-num">{s.n}</div>
                    <div>
                      <div className="lp-step-title">{s.title}</div>
                      <p className="lp-step-desc">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-how-visual lp-reveal lp-d2">
              {[
                { icon: Building2, title: 'Tech Soft Inc.', sub: 'Owner · Free plan · 3 members' },
                { icon: LayoutDashboard, title: 'Sprint 1 Board', sub: '8 tasks · 2 in progress · 3 done' },
                { icon: CheckCircle2, title: 'Fix Login Button', sub: 'Assigned to John · Due May 10' },
                { icon: Bot, title: 'AI Assistant', sub: '3 high-priority tasks need attention' },
              ].map((f, i) => (
                <React.Fragment key={i}>
                  <div className="lp-flow-step">
                    <div className="lp-flow-icon"><f.icon size={22} strokeWidth={1.5} /></div>
                    <div className="lp-flow-text">
                      <strong>{f.title}</strong>
                      <span>{f.sub}</span>
                    </div>
                  </div>
                  {i < 3 && <div className="lp-flow-connector" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* TECH */}
        <section className="lp-section" id="lp-tech" style={{ background: 'white' }}>
          <div className="lp-tech-inner">
            <div className="lp-reveal">
              <div className="lp-section-label">Tech Stack</div>
              <h2 className="lp-section-title">Built with Modern Tools</h2>
              <p className="lp-section-desc">Structura is built on a reliable, production-grade stack designed for performance and scalability.</p>
              <div className="lp-tech-pills">
                {techStack.map((t) => (
                  <div className="lp-pill" key={t.label}>
                    <t.icon size={16} strokeWidth={1.5} />
                    <span>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-code-box lp-reveal lp-d2">
              <div className="lp-code">
                <div><span className="lp-code-comment">// Structura Architecture</span></div>
                <div>&nbsp;</div>
                <div><span className="lp-code-key">const</span> structura = {'{'}</div>
                <div>&nbsp; <span className="lp-code-key">frontend</span>: <span className="lp-code-str">'React + TypeScript'</span>,</div>
                <div>&nbsp; <span className="lp-code-key">backend</span>: <span className="lp-code-str">'Supabase Edge Functions'</span>,</div>
                <div>&nbsp; <span className="lp-code-key">database</span>: <span className="lp-code-str">'PostgreSQL'</span>,</div>
                <div>&nbsp; <span className="lp-code-key">auth</span>: <span className="lp-code-str">'Supabase Auth'</span>,</div>
                <div>&nbsp; <span className="lp-code-key">ai</span>: <span className="lp-code-str">'Groq LLaMA 3.3'</span>,</div>
                <div>&nbsp; <span className="lp-code-key">multiTenant</span>: <span className="lp-code-val">true</span>,</div>
                <div>&nbsp; <span className="lp-code-key">rls</span>: <span className="lp-code-val">true</span>,</div>
                <div>{'}'}</div>
                <div>&nbsp;</div>
                <div><span className="lp-code-comment">// Structure your work.</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-section lp-about" style={{ background: '#f5f4f0' }}>
          <div className="lp-about-inner lp-reveal">
            <div className="lp-section-label">About the Project</div>
            <h2 className="lp-section-title">A Portfolio Project Built with Purpose</h2>
            <p className="lp-about-text">Structura Workspace is a portfolio project developed to demonstrate practical implementation of multi-tenant system design. It focuses on scalable architecture, secure data handling, and user-centric project management features — built to production standards.</p>
          </div>
        </section>

        <section className="lp-cta-section">
          <h2 className="lp-section-title lp-reveal">Ready to Structure Your Work?</h2>
          <p className="lp-reveal lp-d1">Join teams already using Structura to manage projects and scale operations.</p>
          <div className="lp-cta-btns lp-reveal lp-d2">
            <button className="lp-btn-white" onClick={onGetStarted}>Get Started Free →</button>
            <a href="#lp-features" className="lp-btn-ghost">Explore Features</a>
          </div>
        </section>

        <footer className="lp-footer">
          <div>
            <div className="lp-footer-logo">Structura Workspace</div>
            <div className="lp-footer-tagline">Designed & Developed by Gian Nico Otchengco · 2026</div>
          </div>
          <div className="lp-footer-links">
            <a href="https://github.com/nico-otchengco" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="#">Portfolio</a>
            <a href="https://www.linkedin.com/in/gian-nico-otchengco-78a982383/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </div>
        </footer>
      </div>
    </>
  );
}