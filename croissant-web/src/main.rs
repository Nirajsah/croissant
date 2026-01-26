use dioxus::prelude::{manganis, *};

const FAVICON: Asset = asset!("/assets/favicon.ico");
const TAILWIND_CSS: Asset = asset!("/assets/tailwind.css");
const HERO_BANNER: Asset = asset!("/assets/home_croissant.svg");
const FOOTER: Asset = asset!("/assets/footer_croissant.svg");

fn main() {
    dioxus::launch(App);
}

#[component]
fn App() -> Element {
    rsx! {
        document::Link { rel: "icon", href: FAVICON }
        document::Link { rel: "stylesheet", href: TAILWIND_CSS }
        document::Link {
            rel: "stylesheet",
            href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        }
        LandingPage {}
    }
}

/// Main Landing Page
#[component]
fn LandingPage() -> Element {
    rsx! {
        div {
            class: "min-h-screen bg-bg-default font-sans text-fg-primary",
            Navbar {}
            div {
             class: "p-6",
             Hero {}
            }

            Partners {}
            Footer {}
        }
    }
}

/// Navigation Bar
#[component]
fn Navbar() -> Element {
    rsx! {
        nav {
            class: "absolute flex justify-center top-2 left-0 right-0 z-100",
            div {
                class: "w-full max-w-[1320px] py-4 flex items-center justify-center",
                // Navigation Links
                div {
                    class: "hidden md:flex w-full max-w-[400px] items-center justify-around gap-8",
                    a {
                        class: "text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer",
                        "Overview"
                    }
                    a {
                        class: "text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer",
                        "Features"
                    }
                    a {
                        class: "text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer",
                        "Pricing"
                    }
                    a {
                        class: "text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer",
                        "Docs"
                    }
                }
            }
        }
    }
}

/// Hero Section
#[component]
fn Hero() -> Element {
    rsx! {
        section {
            class: "relative min-h-screen overflow-hidden",
            // Content
            div {
                img {
                    class: "absolute",
                    src: HERO_BANNER
                }
                div {
                    class: "grid md:grid-cols-2 gap-12 items-center",
                    // Left: Text Content
                    div {
                        class: "space-y-8 z-50 px-40 pt-30",
                        h1 {
                            class: "text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight",
                            "Simplify your"
                            br {}
                            span { class: "text-white/90", "blockchain transactions." }
                        }
                        p {
                            class: "text-lg md:text-xl text-white/80 max-w-lg leading-relaxed",
                            "From wallet management to secure transfers and DeFi interactions. Experience Web3 like never before."
                        }

                        // CTA Buttons
                        div {
                            class: "flex flex-wrap gap-4 pt-4",
                            button {
                                class: "bg-bg-default text-white px-6 py-3 rounded-lg font-semibold hover:bg-bg-paper transition-all hover:scale-105 shadow-lg",
                                "Get a free account"
                            }
                            button {
                                class: "flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-semibold border border-white/20 hover:bg-white/20 transition-all",
                                "Get a demo"
                                span { class: "text-lg", "↗" }
                            }
                        }

                        // Trust indicators
                        div {
                            class: "flex items-center gap-8 pt-8",
                            div {
                                class: "flex items-center gap-2",
                                span { class: "text-yellow-400", "★★★★★" }
                                span { class: "text-white/70 text-sm", "4.9 out of 5" }
                            }
                            div {
                                class: "flex items-center gap-2",
                                div { class: "w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm", "🏆" }
                                span { class: "text-white/70 text-sm", "Best Web3 Wallet 2025" }
                            }
                        }
                    }

                    // Right: Demo Card
                    div {
                        class: "relative hidden md:block",
                        // Main Card
                    }
                }
            }

            // Download Section
            div {
                class: "relative z-10 max-w-7xl mx-auto px-6 pb-20",
                div {
                    class: "text-center",
                    p { class: "text-white/60 text-sm mb-4", "Download our app from" }
                    div {
                        class: "flex justify-center gap-4",
                        button {
                            class: "flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg font-medium hover:bg-white/90 transition-all",
                            span { class: "text-xl", "🍎" }
                            span { "App Store" }
                        }
                        button {
                            class: "flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg font-medium hover:bg-white/90 transition-all",
                            span { class: "text-xl", "▶" }
                            span { "Google Play" }
                        }
                    }
                }
            }
        }
    }
}

/// Partner Logos Section
#[component]
fn Partners() -> Element {
    rsx! {
        section {
            class: "bg-bg-default py-12",
            div {
                class: "max-w-7xl mx-auto px-6",
                div {
                    class: "flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-50",
                    span { class: "text-2xl font-bold text-fg-secondary", "Linera" }
                    span { class: "text-2xl font-bold text-fg-secondary", "Web3" }
                    span { class: "text-2xl font-bold text-fg-secondary", "DeFi" }
                    span { class: "text-2xl font-bold text-fg-secondary", "Crypto" }
                    span { class: "text-2xl font-bold text-fg-secondary", "Blockchain" }
                }
            }
        }
    }
}

/// Footer Component
#[component]
fn Footer() -> Element {
    rsx! {
        footer {
            class: "bg-bg-default relative w-full h-full min-h-[450px] flex justify-center items-end",
            img {
                class: "absolute object-contain px-10 py-20",
                src: FOOTER
            }
            // Bottom Bar
            div {
                class: "flex flex-col md:flex-row items-center justify-between mt-12 py-4",
                div {
                    class: "flex items-center gap-2 text-fg-secondary text-sm",
                    span { "🥐" }
                    span { "Croissant, 2025" }
                }
            }
        }
    }
}
