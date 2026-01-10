import PricingSection from "@/components/home/PricingSection";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
        {/* Animated background - optimized for mobile */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Main gradient orbs - simplified on mobile */}
          <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-cyan-500/15 md:bg-cyan-500/20 rounded-full blur-2xl md:blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-emerald-500/10 md:bg-emerald-500/15 rounded-full blur-2xl md:blur-3xl" />
          <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10 rounded-full blur-3xl" />
          
          {/* Grid pattern - hidden on mobile */}
          <div className="hidden md:block absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
          
          {/* Radial gradient overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_70%)]" />
        </div>
        
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-3 rounded-full bg-white/[0.03] border border-white/10 px-5 py-2.5 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="hidden md:inline-flex animate-ping absolute h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">La plateforme créative</span>
          </div>
          
          {/* Main title */}
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black leading-[0.9] tracking-tight mb-8">
            <span className="block bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
              Connectez vos idées
            </span>
            <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              aux meilleurs talents
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-white/50 leading-relaxed mb-12">
            CREIX met en relation créateurs de contenu et graphistes/monteurs vidéo 
            pour des collaborations <span className="text-cyan-400">simples</span>, <span className="text-emerald-400">rapides</span> et <span className="text-white/70">sécurisées</span>.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/pricing"
              className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-8 py-4 text-base font-bold text-slate-900 shadow-xl md:shadow-2xl shadow-cyan-500/20 md:shadow-cyan-500/25 active:scale-95 md:hover:scale-105 transition-transform overflow-hidden"
            >
              <span className="relative z-10">S&apos;abonner maintenant</span>
              <svg className="relative z-10 w-5 h-5 md:group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a
              href="/pricing"
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.02] px-8 py-4 text-base font-semibold text-white active:bg-white/[0.05] md:hover:bg-white/[0.05] md:hover:border-white/30 transition-colors"
            >
              <span>Voir les tarifs</span>
              <svg className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </div>
          
          {/* Trust badges */}
          <div className="flex items-center justify-center gap-8 mt-16 pt-8 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 text-white/30">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium">Zéro commission</span>
            </div>
            <div className="flex items-center gap-2 text-white/30">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium">Sans engagement</span>
            </div>
            <div className="flex items-center gap-2 text-white/30">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-medium">+500 créateurs</span>
            </div>
          </div>
        </div>
        
      </section>

      {/* Platforms Section - Pour les créateurs */}
      <section className="relative py-20 md:py-32 px-4 overflow-hidden">
        {/* Background - simplified on mobile */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-creix-blue/[0.02] to-transparent pointer-events-none" />
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-creix-blue/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] border border-white/10 px-4 py-2 mb-6">
              <span className="text-lg">🎬</span>
              <span className="text-xs font-medium uppercase tracking-widest text-creix-blue/80">Pour les créateurs</span>
            </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Vous créez du contenu ?
          </h2>
          <p className="max-w-xl mx-auto text-creix-blue/60 text-lg">
            Miniatures, montages, visuels... Publiez ce dont vous avez besoin, les pros répondent.
          </p>
          </div>
          
          {/* Platform cards - Modern grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                name: "YouTube",
                icon: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
                desc: "Miniatures, intros, montages",
                color: "red",
                gradient: "from-red-500 to-rose-600"
              },
              {
                name: "TikTok",
                icon: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
                desc: "Montages courts, effets, trends",
                color: "pink",
                gradient: "from-pink-500 via-fuchsia-500 to-cyan-400"
              },
              {
                name: "Twitch",
                icon: "M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z",
                desc: "Overlays, alertes, emotes",
                color: "purple",
                gradient: "from-purple-500 to-violet-600"
              },
              {
                name: "Instagram",
                icon: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
                desc: "Reels, stories, posts",
                color: "orange",
                gradient: "from-orange-500 via-pink-500 to-purple-600"
              }
            ].map((platform, i) => (
              <div
                key={i}
                className="group relative rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6 md:p-8 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-200 cursor-default overflow-hidden"
              >
                {/* Hover glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${platform.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-150 blur-xl`} />
                
                <div className="relative flex flex-col items-center text-center space-y-4">
                  {/* Icon container */}
                  <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${platform.gradient} p-[2px] group-hover:scale-110 transition-transform duration-150`}>
                    <div className="w-full h-full rounded-2xl bg-creix-black flex items-center justify-center">
                      <svg className="w-8 h-8 md:w-10 md:h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d={platform.icon}/>
                  </svg>
              </div>
            </div>
            
                  {/* Text */}
                  <div>
                    <h3 className={`text-lg font-bold text-white mb-1 group-hover:bg-gradient-to-r group-hover:${platform.gradient} group-hover:bg-clip-text group-hover:text-transparent transition-all`}>
                      {platform.name}
                    </h3>
                    <p className="text-xs md:text-sm text-white/40">{platform.desc}</p>
            </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* CTA */}
          <div className="text-center mt-14">
            <a
              href="/signup?role=CREATOR"
              className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-creix-blue to-cyan-400 px-8 py-4 text-base font-bold text-creix-black shadow-lg shadow-creix-blue/25 hover:shadow-creix-blue/40 hover:scale-105 transition-all duration-150"
            >
              <span>Je suis créateur</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Pour les graphistes */}
      <section className="relative py-20 md:py-28 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                  Pour les graphistes & monteurs
                </span>
              </div>

              <h2 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-white">
                Montrez votre talent,
                <br />
                <span className="text-creix-blue">trouvez des clients</span>
              </h2>

              <p className="mt-4 max-w-lg text-base sm:text-lg leading-relaxed text-white/55">
                Répondez aux besoins des créateurs, échangez en direct, et développez votre activité.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  { title: "Profil professionnel", desc: "Un portfolio clair pour être contacté plus vite." },
                  { title: "Messagerie intégrée", desc: "Discutez, brief, fichiers et suivi au même endroit." },
                  { title: "Paiement direct", desc: "Le règlement se fait entre vous et le créateur (virement bancaire)." }
                ].map((item) => (
                  <li key={item.title} className="flex gap-4">
                    <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                      <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <div>
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="text-sm text-white/45">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <a
                href="/signup?role=DESIGNER"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-creix-blue px-8 py-4 text-base font-bold text-black transition hover:bg-creix-blue/90"
              >
                Je suis graphiste / monteur
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>

            <div className="rounded-3xl border border-white/[0.10] bg-white/[0.02] p-6 md:p-8">
              <div className="space-y-3">
                {[
                  {
                    title: "Portfolio visible",
                    desc: "Montrez vos meilleures créations.",
                    icon: (
                      <svg className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                      </svg>
                    )
                  },
                  {
                    title: "Demandes qualifiées",
                    desc: "Des créateurs qui savent ce qu’ils veulent.",
                    icon: (
                      <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a4 4 0 01-4 4H7l-4 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" />
                      </svg>
                    )
                  },
                  {
                    title: "Revenus réguliers",
                    desc: "Construisez une clientèle fidèle.",
                    icon: (
                      <svg className="h-5 w-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-10V6m0 12v2m8-10a8 8 0 11-16 0 8 8 0 0116 0z" />
                      </svg>
                    )
                  }
                ].map((row) => (
                  <div key={row.title} className="flex items-start gap-4 rounded-2xl border border-white/[0.08] bg-black/30 p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.03]">
                      {row.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{row.title}</p>
                      <p className="text-sm text-white/45">{row.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="relative py-20 md:py-32 px-4 overflow-hidden">
        {/* Subtle background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-creix-blue/[0.05] via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-20">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] border border-white/10 px-4 py-2 mb-6">
              <svg className="w-4 h-4 text-creix-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-widest text-creix-blue/80">Simple & rapide</span>
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              Comment ça marche ?
            </h2>
          </div>
          
          {/* Steps */}
            <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-24 left-[16.666%] right-[16.666%] h-[2px] bg-gradient-to-r from-creix-blue/50 via-emerald-500/50 to-creix-blue/50" />
            
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {[
                {
                  num: "01",
                  icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
                  title: "Créez votre compte",
                  desc: "Inscrivez-vous en quelques clics et choisissez votre rôle : créateur ou graphiste.",
                  color: "from-cyan-500 to-blue-500"
                },
                {
                  num: "02",
                  icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
                  title: "Trouvez le bon match",
                  desc: "Parcourez les profils, filtrez par compétences et trouvez le partenaire idéal.",
                  color: "from-emerald-500 to-teal-500"
                },
                {
                  num: "03",
                  icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
                  title: "Collaborez",
                  desc: "Échangez via la messagerie intégrée et lancez votre collaboration créative.",
                  color: "from-violet-500 to-purple-500"
                }
              ].map((step, i) => (
                <div key={i} className="group relative flex flex-col items-center text-center">
                  {/* Number badge */}
                  <div className={`relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} p-[2px] mb-8 shadow-lg shadow-${step.color.split('-')[1]}-500/25 group-hover:scale-110 transition-transform duration-150`}>
                    <div className="w-full h-full rounded-2xl bg-creix-black flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                      </svg>
              </div>
            </div>
            
                  {/* Step number */}
                  <span className={`text-5xl font-black bg-gradient-to-br ${step.color} bg-clip-text text-transparent opacity-20 absolute top-0 -translate-y-4`}>
                    {step.num}
                  </span>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-creix-blue transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-creix-blue/60 leading-relaxed max-w-xs">
                    {step.desc}
                </p>
              </div>
              ))}
            </div>
          </div>
          
          {/* CTA */}
          <div className="text-center mt-16">
            <a
              href="/signup"
              className="inline-flex items-center gap-2 text-creix-blue hover:text-white transition-colors group"
            >
              <span className="font-medium">Commencer maintenant</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Pricing preview - dynamique selon l'abonnement */}
      <PricingSection />

      {/* CTA Final */}
      <section className="relative py-20 md:py-32 px-4 overflow-hidden">
        {/* Background - optimized */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/[0.08] via-transparent to-transparent" />
          <div className="hidden md:block absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-t from-cyan-500/20 via-emerald-500/10 to-transparent rounded-full blur-3xl" />
          
          {/* Animated particles - desktop only */}
          <div className="hidden md:block absolute inset-0">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-cyan-400/30 rounded-full animate-pulse"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 3) * 20}%`,
                  animationDelay: `${i * 0.5}s`
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] border border-white/10 px-4 py-2 mb-8">
            <span className="text-lg">🚀</span>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">Rejoignez-nous</span>
          </div>
          
          {/* Title */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
            Prêt à <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">collaborer</span> ?
          </h2>
          
          {/* Subtitle */}
          <p className="text-white/50 text-lg sm:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
            Rejoignez CREIX aujourd&apos;hui et commencez à créer des projets incroyables 
            avec les <span className="text-white/70">meilleurs talents créatifs</span>.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/signup"
              className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-8 md:px-10 py-4 md:py-5 text-base md:text-lg font-bold text-slate-900 shadow-xl md:shadow-2xl shadow-cyan-500/25 md:shadow-cyan-500/30 active:scale-95 md:hover:scale-105 transition-transform overflow-hidden"
            >
              <span className="relative z-10">Créer mon compte gratuitement</span>
              <svg className="relative z-10 w-5 h-5 md:group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
