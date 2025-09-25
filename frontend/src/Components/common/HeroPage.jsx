import React, { useState, useEffect } from 'react';
import { 
  Play, 
  PlayCircle, 
  Zap, 
  Workflow, 
  FileText, 
  Image, 
  Video, 
  Link2, 
  ShieldCheck, 
  ListChecks, 
  FileSearch, 
  Clock, 
  Sparkles, 
  Hand, 
  Hourglass, 
  Ban, 
  UploadCloud, 
  ArrowRight, 
  Cpu, 
  Gauge, 
  FileOutput, 
  ScanLine, 
  BookOpenCheck, 
  SearchCheck, 
  PhoneCall, 
  Shield, 
  Rocket, 
  CheckCircle2, 
  Smile, 
  Mail, 
  ListTree, 
  Globe,
  Moon,
  Sun
} from 'lucide-react';

const HeroPage = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkTheme(savedTheme === 'light');
    } else {
      setIsDarkTheme(window.matchMedia('(prefers-color-scheme: light)').matches);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'light' : 'dark');
    localStorage.setItem('theme', isDarkTheme ? 'light' : 'dark');
  }, [isDarkTheme]);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased selection:bg-[var(--accent-color)]/10 selection:text-[var(--text-primary)] font-[Manrope,ui-sans-serif,system-ui,-apple-system,'Segoe_UI',Roboto,Helvetica,Arial]">

      {/* Top Nav */}
      <header className="w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <a href="#" className="inline-flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-md bg-[var(--accent-color)] text-[var(--button-text)] flex items-center justify-center shadow-sm ring-1 ring-black/5">
              <span className="text-xs font-medium tracking-tight font-[Varela_Round,Manrope,ui-sans-serif]">AG</span>
            </div>
            <span className="text-sm sm:text-base text-[var(--text-primary)] font-medium tracking-tight font-[Varela_Round,Manrope,ui-sans-serif]">AdGuard AI</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--text-secondary)]">
            <a href="#features" className="hover:text-[var(--text-primary)] hover:underline underline-offset-4">Features</a>
            <a href="#how" className="hover:text-[var(--text-primary)] hover:underline underline-offset-4">How it works</a>
            <a href="#demo" className="hover:text-[var(--text-primary)] hover:underline underline-offset-4">Demo</a>
            <a href="#team" className="hover:text-[var(--text-primary)] hover:underline underline-offset-4">Team</a>
          </nav>
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-md bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="hidden sm:flex items-center gap-3">
              <a href="#contact" className="text-sm text-[var(--text-primary)] hover:text-[var(--button-hover)]">Contact</a>
              <a href="#demo" className="inline-flex items-center rounded-md bg-[var(--button-bg)] px-3.5 py-2 text-sm text-[var(--button-text)] shadow-sm hover:bg-[var(--button-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-color)] focus:ring-offset-[var(--bg-primary)]">
                <PlayCircle className="mr-2 h-4 w-4" />
                Try the Demo
              </a>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-px w-full bg-[var(--border-color)]"></div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-stone-100 border border-slate-200 shadow-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0">
              {/* Hero Left */}
              <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-1.5 text-xs text-[var(--text-secondary)] shadow-sm animate-fade-up">
                  <span className="inline-flex h-2 w-2 rounded-full bg-[var(--highlight-color)]"></span>
                  New: AI policy-safe checks in seconds
                </div>

                <h1 className="mt-4 text-[32px] md:text-[40px] leading-[1.15] tracking-tight text-[var(--accent-color)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium animate-fade-up animate-delay-100">
                  Instant Ad Compliance Checker
                </h1>
                <p className="mt-3 text-xl md:text-2xl text-[var(--text-primary)] tracking-tight font-[Varela_Round,Manrope,ui-sans-serif] font-medium animate-fade-up animate-delay-150">
                  AI-Powered Multimodal Tool for Fast, Policy-Safe Ad Approvals
                </p>
                <p className="mt-4 text-base text-[var(--text-secondary)] animate-fade-up animate-delay-200">
                  Automate compliance across text, images, video, and landing pages. Cut review time from hours to seconds with explainable results.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-fade-up animate-delay-250">
                  <a href="#demo" className="inline-flex items-center justify-center rounded-md bg-[var(--button-bg)] px-5 py-3 text-sm text-[var(--button-text)] shadow-sm hover:bg-[var(--button-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-color)] focus:ring-offset-[var(--bg-secondary)]">
                    <Zap className="mr-2 h-4 w-4" />
                    Try the Demo
                  </a>
                  <a href="#how" className="inline-flex items-center justify-center rounded-md bg-[var(--card-bg)] px-5 py-3 text-sm text-[var(--text-primary)] hover:text-[var(--button-hover)] border border-[var(--border-color)] shadow-sm hover:shadow-md">
                    <Workflow className="mr-2 h-4 w-4" />
                    See How It Works
                  </a>
                </div>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up animate-delay-300">
                  <div className="rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] p-3 text-center">
                    <p className="text-sm text-[var(--text-secondary)]">Avg review</p>
                    <p className="mt-1 text-base font-medium text-[var(--text-primary)]">≤ 30s</p>
                  </div>
                  <div className="rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] p-3 text-center">
                    <p className="text-sm text-[var(--text-secondary)]">Coverage</p>
                    <p className="mt-1 text-base font-medium text-[var(--text-primary)]">Text · Image · Video · LP</p>
                  </div>
                  <div className="rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] p-3 text-center">
                    <p className="text-sm text-[var(--text-secondary)]">Transparency</p>
                    <p className="mt-1 text-base font-medium text-[var(--text-primary)]">Explainable</p>
                  </div>
                  <div className="rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] p-3 text-center">
                    <p className="text-sm text-[var(--text-secondary)]">Escalation</p>
                    <p className="mt-1 text-base font-medium text-[var(--text-primary)]">AI Calls</p>
                  </div>
                </div>
              </div>

              {/* Hero Right */}
              <div className="relative overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-200 bg-[var(--card-bg)]" style={{ borderColor: 'var(--border-color)' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[var(--accent-color)]/5 pointer-events-none"></div>
                <div className="p-6 sm:p-10 lg:p-12 h-full flex items-center">
                  <div className="w-full">
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]/80 backdrop-blur-sm p-4 shadow-sm animate-fade-left animate-delay-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-[var(--highlight-color)]"></div>
                          <div className="h-2.5 w-2.5 rounded-full bg-[var(--accent-color)]"></div>
                          <div className="h-2.5 w-2.5 rounded-full bg-[var(--text-primary)]"></div>
                        </div>
                        <span className="text-xs text-[var(--text-secondary)]">Preview</span>
                      </div>
                      <div className="mt-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="rounded-md bg-[var(--card-bg)] border border-[var(--border-color)] p-3">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-[var(--accent-color)]" />
                              <span className="text-sm text-[var(--text-primary)]">Text</span>
                            </div>
                            <p className="mt-2 text-xs text-[var(--text-secondary)]">Claims, disclaimers, sensitive terms</p>
                          </div>
                          <div className="rounded-md bg-[var(--card-bg)] border border-[var(--border-color)] p-3">
                            <div className="flex items-center gap-2">
                              <Image className="h-4 w-4 text-[var(--accent-color)]" />
                              <span className="text-sm text-[var(--text-primary)]">Image</span>
                            </div>
                            <p className="mt-2 text-xs text-[var(--text-secondary)]">Logos, overlays, prohibited content</p>
                          </div>
                          <div className="rounded-md bg-[var(--card-bg)] border border-[var(--border-color)] p-3">
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4 text-[var(--accent-color)]" />
                              <span className="text-sm text-[var(--text-primary)]">Video</span>
                            </div>
                            <p className="mt-2 text-xs text-[var(--text-secondary)]">Frames, captions, audio claims</p>
                          </div>
                          <div className="rounded-md bg-[var(--card-bg)] border border-[var(--border-color)] p-3">
                            <div className="flex items-center gap-2">
                              <Link2 className="h-4 w-4 text-[var(--accent-color)]" />
                              <span className="text-sm text-[var(--text-primary)]">Landing Page</span>
                            </div>
                            <p className="mt-2 text-xs text-[var(--text-secondary)]">Redirects, forms, disclosures</p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-[var(--accent-color)]" />
                                <span className="text-sm text-[var(--text-primary)]">Compliance Score</span>
                              </div>
                              <span className="text-xs rounded px-2 py-0.5 bg-[var(--accent-color)]/10 text-[var(--accent-color)]">92/100</span>
                            </div>
                            <p className="mt-2 text-xs text-[var(--text-secondary)]">Overall risk: Low</p>
                          </div>
                          <div className="rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ListChecks className="h-4 w-4 text-[var(--accent-color)]" />
                                <span className="text-sm text-[var(--text-primary)]">Violations</span>
                              </div>
                              <span className="text-xs rounded px-2 py-0.5 bg-[var(--highlight-color)]/10 text-[var(--highlight-color)]">2 flagged</span>
                            </div>
                            <p className="mt-2 text-xs text-[var(--text-secondary)]">Edit copy in CTA; clarify pricing</p>
                          </div>
                          <div className="rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileSearch className="h-4 w-4 text-[var(--accent-color)]" />
                                <span className="text-sm text-[var(--text-primary)]">Report</span>
                              </div>
                              <span className="text-xs rounded px-2 py-0.5 bg-[var(--accent-color)]/10 text-[var(--accent-color)]">View</span>
                            </div>
                            <p className="mt-2 text-xs text-[var(--text-secondary)]">Evidence + policy citations</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-[var(--text-secondary)]" />
                          <span className="text-xs text-[var(--text-secondary)]">Review in ~28s</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-[var(--accent-color)]" />
                          <span className="text-xs text-[var(--text-secondary)]">Explainable</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-[28px] md:text-[32px] tracking-tight text-[var(--accent-color)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium animate-fade-up">
              The problem with ad compliance today
            </h2>
            <p className="mt-3 text-base text-[var(--text-secondary)] animate-fade-up animate-delay-100">
              Manual reviews are slow and inconsistent. Policy changes are frequent. Advertisers face surprise rejections and delays that stall campaigns.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm hover:shadow-md transition animate-fade-up animate-delay-150">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-[var(--accent-color)]/10 flex items-center justify-center">
                  <Hand className="h-5 w-5 text-[var(--accent-color)]" />
                </div>
                <h3 className="text-[20px] tracking-tight text-[var(--text-primary)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">Manual & error-prone</h3>
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Inconsistent interpretations lead to rework and escalations.</p>
            </div>

            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm hover:shadow-md transition animate-fade-up animate-delay-200">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-[var(--accent-color)]/10 flex items-center justify-center">
                  <Hourglass className="h-5 w-5 text-[var(--accent-color)]" />
                </div>
                <h3 className="text-[20px] tracking-tight text-[var(--text-primary)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">Slow cycles</h3>
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Turnarounds in hours or days hurt go-to-market speed.</p>
            </div>

            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm hover:shadow-md transition animate-fade-up animate-delay-250">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-[var(--highlight-color)]/10 flex items-center justify-center">
                  <Ban className="h-5 w-5 text-[var(--highlight-color)]" />
                </div>
                <h3 className="text-[20px] tracking-tight text-[var(--text-primary)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">Unexpected rejections</h3>
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Policy mismatches cause last-minute blocks and lost spend.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-[28px] md:text-[32px] tracking-tight text-[var(--accent-color)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium animate-fade-up">
              The solution: multimodal AI coverage
            </h2>
            <p className="mt-3 text-base text-[var(--text-secondary)] animate-fade-up animate-delay-100">
              AdGuard AI evaluates every asset: copy, visuals, audio, and destination pages—grounded in your latest policies.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm hover:border-[var(--accent-color)]/40 transition animate-fade-up animate-delay-100">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[var(--accent-color)]" />
                <h3 className="text-[20px] tracking-tight text-[var(--text-primary)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">Text</h3>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Detect misleading claims, sensitive terms, and missing disclaimers.</p>
            </div>

            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm hover:border-[var(--accent-color)]/40 transition animate-fade-up animate-delay-150">
              <div className="flex items-center gap-3">
                <Image className="h-5 w-5 text-[var(--accent-color)]" />
                <h3 className="text-[20px] tracking-tight text-[var(--text-primary)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">Image</h3>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Flag overlays, prohibited categories, and logo misuse.</p>
            </div>

            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm hover:border-[var(--accent-color)]/40 transition animate-fade-up animate-delay-200">
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-[var(--accent-color)]" />
                <h3 className="text-[20px] tracking-tight text-[var(--text-primary)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">Video</h3>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Analyze frames, captions, and audio claims frame-by-frame.</p>
            </div>

            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm hover:border-[var(--accent-color)]/40 transition animate-fade-up animate-delay-250">
              <div className="flex items-center gap-3">
                <Link2 className="h-5 w-5 text-[var(--accent-color)]" />
                <h3 className="text-[20px] tracking-tight text-[var(--text-primary)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">Landing Page</h3>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Verify redirects, disclosures, forms, and data collection.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-[28px] md:text-[32px] tracking-tight text-[var(--accent-color)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium animate-fade-up">
              How it works
            </h2>
            <p className="mt-3 text-base text-[var(--text-secondary)] animate-fade-up animate-delay-100">
              A streamlined flow that takes you from upload to policy-safe approval.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-7 gap-4 items-center">
            {/* Step 1 */}
            <div className="relative rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm animate-fade-up animate-delay-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-[var(--accent-color)]" />
                  <h3 className="text-[20px] tracking-tight text-[var(--text-primary)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">Upload</h3>
                </div>
                <span className="text-xs rounded-full px-2 py-0.5 bg-[var(--accent-color)]/10 text-[var(--accent-color)]">1</span>
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Submit ad copy, creatives, video, and landing page URL.</p>
            </div>

            {/* Arrow */}
            <div className="hidden lg:flex items-center justify-center animate-fade-up animate-delay-150">
              <ArrowRight className="h-5 w-5 text-[var(--text-secondary)]" />
            </div>

            {/* Step 2 */}
            <div className="relative rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm animate-fade-up animate-delay-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-[var(--accent-color)]" />
                  <h3 className="text-[20px] tracking-tight text-[var(--text-primary)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">AI checks</h3>
                </div>
                <span className="text-xs rounded-full px-2 py-0.5 bg-[var(--accent-color)]/10 text-[var(--accent-color)]">2</span>
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Multimodal analysis grounded in your latest policy set.</p>
            </div>

            {/* Arrow */}
            <div className="hidden lg:flex items-center justify-center animate-fade-up animate-delay-250">
              <ArrowRight className="h-5 w-5 text-[var(--text-secondary)]" />
            </div>

            {/* Step 3 */}
            <div className="relative rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm animate-fade-up animate-delay-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-[var(--accent-color)]" />
                  <h3 className="text-[20px] tracking-tight text-[var(--text-primary)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">Score</h3>
                </div>
                <span className="text-xs rounded-full px-2 py-0.5 bg-[var(--accent-color)]/10 text-[var(--accent-color)]">3</span>
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Receive a compliance score with risk levels.</p>
            </div>

            {/* Arrow */}
            <div className="hidden lg:flex items-center justify-center animate-fade-up animate-delay-350">
              <ArrowRight className="h-5 w-5 text-[var(--text-secondary)]" />
            </div>

            {/* Step 4 */}
            <div className="relative rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm animate-fade-up animate-delay-350">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileOutput className="h-5 w-5 text-[var(--accent-color)]" />
                  <h3 className="text-[20px] tracking-tight text-[var(--text-primary)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">Report</h3>
                </div>
                <span className="text-xs rounded-full px-2 py-0.5 bg-[var(--accent-color)]/10 text-[var(--accent-color)]">4</span>
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Explainable report with evidence and policy citations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-[28px] md:text-[32px] tracking-tight text-[var(--accent-color)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium animate-fade-up">
              Features that de-risk ad approvals
            </h2>
            <p className="mt-3 text-base text-[var(--text-secondary)] animate-fade-up animate-delay-100">
              Built for compliance teams and ad ops to move fast with confidence.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm hover:shadow-md animate-fade-up animate-delay-100">
              <div className="flex items-center gap-3">
                <ScanLine className="h-5 w-5 text-[var(--accent-color)]" />
                <h3 className="text-[20px] tracking-tight font-[Varela_Round,Manrope,ui-sans-serif] font-medium text-[var(--text-primary)]">Multimodal AI</h3>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Understands text, images, video, audio, and landing pages together.</p>
            </div>

            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm hover:shadow-md animate-fade-up animate-delay-150">
              <div className="flex items-center gap-3">
                <BookOpenCheck className="h-5 w-5 text-[var(--accent-color)]" />
                <h3 className="text-[20px] tracking-tight font-[Varela_Round,Manrope,ui-sans-serif] font-medium text-[var(--text-primary)]">Policy RAG</h3>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Retrieval-augmented grounding to the latest policy corpus.</p>
            </div>

            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm hover:shadow-md animate-fade-up animate-delay-200">
              <div className="flex items-center gap-3">
                <SearchCheck className="h-5 w-5 text-[var(--accent-color)]" />
                <h3 className="text-[20px] tracking-tight font-[Varela_Round,Manrope,ui-sans-serif] font-medium text-[var(--text-primary)]">Explainable Reports</h3>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Evidence-linked findings and clear remediation guidance.</p>
            </div>

            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm hover:shadow-md animate-fade-up animate-delay-250">
              <div className="flex items-center gap-3">
                <PhoneCall className="h-5 w-5 text-[var(--accent-color)]" />
                <h3 className="text-[20px] tracking-tight font-[Varela_Round,Manrope,ui-sans-serif] font-medium text-[var(--text-primary)]">AI Clarification Calls</h3>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Automated Q&A to resolve ambiguities before escalation.</p>
            </div>

            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm hover:shadow-md animate-fade-up animate-delay-300">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-[var(--accent-color)]" />
                <h3 className="text-[20px] tracking-tight font-[Varela_Round,Manrope,ui-sans-serif] font-medium text-[var(--text-primary)]">Risk Controls</h3>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Configurable thresholds, audit trails, and approval routing.</p>
            </div>

            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm hover:shadow-md animate-fade-up animate-delay-350">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-[var(--accent-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-[20px] tracking-tight font-[Varela_Round,Manrope,ui-sans-serif] font-medium text-[var(--text-primary)]">Integrations</h3>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">API and console. Connect to DAM, CMP, and ad platforms.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-[28px] md:text-[32px] tracking-tight text-[var(--accent-color)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">
              Benefits
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm animate-fade-up animate-delay-100">
              <div className="flex items-center gap-3">
                <Rocket className="h-5 w-5 text-[var(--accent-color)]" />
                <h3 className="text-[20px] tracking-tight text-[var(--text-primary)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">Faster approvals</h3>
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Reduce review times from hours to seconds.</p>
            </div>

            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm animate-fade-up animate-delay-150">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[var(--accent-color)]" />
                <h3 className="text-[20px] tracking-tight text-[var(--text-primary)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">Fewer rejections</h3>
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Catch issues pre-submission and avoid last-minute blocks.</p>
            </div>

            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm animate-fade-up animate-delay-200">
              <div className="flex items-center gap-3">
                <Smile className="h-5 w-5 text-[var(--accent-color)]" />
                <h3 className="text-[20px] tracking-tight text-[var(--text-primary)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">Better advertiser experience</h3>
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Transparent guidance builds trust and speed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo / Prototype */}
      <section id="demo" className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-[28px] md:text-[32px] tracking-tight text-[var(--accent-color)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">
              See it in action
            </h2>
            <p className="mt-3 text-base text-[var(--text-secondary)]">Quick demo of upload → check → score → report.</p>
          </div>

          <div className="mt-6 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm overflow-hidden">
            <div className="aspect-video relative">
              <img src="https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=1600&auto=format&fit=crop" alt="Product demo placeholder" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[var(--text-primary)]/20"></div>
              <button className="absolute inset-0 m-auto h-14 w-14 rounded-full bg-[var(--button-bg)] text-[var(--button-text)] shadow-lg hover:bg-[var(--button-hover)] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-color)]" aria-label="Play demo">
                <Play className="h-6 w-6 m-auto" />
              </button>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--card-bg)]/80 backdrop-blur-sm px-3 py-1.5 text-xs text-[var(--text-primary)] border border-[var(--border-color)]">
                  <Sparkles className="h-4 w-4 text-[var(--accent-color)]" />
                  AI compliance preview
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--card-bg)]/80 backdrop-blur-sm px-3 py-1.5 text-xs text-[var(--highlight-color)] border border-[var(--border-color)]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  2 flags detected
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a href="#contact" className="inline-flex items-center rounded-md bg-[var(--button-bg)] px-4 py-2.5 text-sm text-[var(--button-text)] shadow-sm hover:bg-[var(--button-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-color)] focus:ring-offset-[var(--bg-primary)]">
              <Mail className="mr-2 h-4 w-4" />
              Request access
            </a>
            <a href="#features" className="inline-flex items-center rounded-md bg-[var(--card-bg)] px-4 py-2.5 text-sm text-[var(--text-primary)] border border-[var(--border-color)] hover:text-[var(--button-hover)] shadow-sm">
              <ListTree className="mr-2 h-4 w-4" />
              Explore features
            </a>
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-[28px] md:text-[32px] tracking-tight text-[var(--accent-color)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">
              Team
            </h2>
            <p className="mt-3 text-base text-[var(--text-secondary)]">We're a cross-functional team from ads, policy, and ML systems.</p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Member 1 */}
            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <img src="https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=400&auto=format&fit=crop" alt="Team member" className="h-14 w-14 rounded-full object-cover border border-[var(--border-color)]" />
                <div>
                  <h3 className="text-[18px] tracking-tight text-[var(--text-primary)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">Haresh Kurade</h3>
                  <p className="text-sm text-[var(--text-secondary)]">CEO • Product & Policy</p>
                </div>
              </div>
            </div>
            {/* Member 2 */}
            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop" alt="Team member" className="h-14 w-14 rounded-full object-cover border border-[var(--border-color)]" />
                <div>
                  <h3 className="text-[18px] tracking-tight text-[var(--text-primary)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">Keval Shah</h3>
                  <p className="text-sm text-[var(--text-secondary)]">CTO • Multimodal ML</p>
                </div>
              </div>
            </div>
            {/* Member 3 */}
            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <img src="https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=400&auto=format&fit=crop" alt="Team member" className="h-14 w-14 rounded-full object-cover border border-[var(--border-color)]" />
                <div>
                  <h3 className="text-[18px] tracking-tight text-[var(--text-primary)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">Krish Thakkar</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Head of Compliance Ops</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="pt-12 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 sm:p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="inline-flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-[var(--accent-color)] text-[var(--button-text)] flex items-center justify-center shadow-sm ring-1 ring-black/5">
                    <span className="text-xs font-medium tracking-tight font-[Varela_Round,Manrope,ui-sans-serif]">AG</span>
                  </div>
                  <span className="text-sm text-[var(--text-primary)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">AdGuard AI</span>
                </div>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">Instant ad compliance checks for text, image, video, and landing pages.</p>
              </div>

              <div>
                <h4 className="text-sm text-[var(--text-primary)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">Links</h4>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <a href="#features" className="text-[var(--text-secondary)] hover:text-[var(--button-hover)]">Features</a>
                  <a href="#how" className="text-[var(--text-secondary)] hover:text-[var(--button-hover)]">How it works</a>
                  <a href="#demo" className="text-[var(--text-secondary)] hover:text-[var(--button-hover)]">Demo</a>
                  <a href="#team" className="text-[var(--text-secondary)] hover:text-[var(--button-hover)]">Team</a>
                </div>
              </div>

              <div>
                <h4 className="text-sm text-[var(--text-primary)] font-[Varela_Round,Manrope,ui-sans-serif] font-medium">Contact</h4>
                <div className="mt-3 flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
                  <a href="mailto:hello@adguard.ai" className="inline-flex items-center gap-2 hover:text-[var(--button-hover)]">
                    <Mail className="h-4 w-4" />
                    hello@adguard.ai
                  </a>
                  <a href="#" className="inline-flex items-center gap-2 hover:text-[var(--button-hover)]">
                    <Globe className="h-4 w-4" />
                    adguard.ai
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 h-px w-full bg-[var(--border-color)]"></div>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-secondary)]">
              <p>© {new Date().getFullYear()} AdGuard AI. All rights reserved.</p>
              <div className="flex items-center gap-4 mt-2 sm:mt-0">
                <a href="#" className="hover:text-[var(--button-hover)]">Privacy</a>
                <a href="#" className="hover:text-[var(--button-hover)]">Terms</a>
                <a href="#" className="hover:text-[var(--button-hover)]">Security</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HeroPage