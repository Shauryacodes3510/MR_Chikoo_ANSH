"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "Features", href: "#features" },
  { name: "How It Works", href: "#features" },
  { name: "Download", href: "#get-chikoo" },
];

export default function Navbar() {
  const handleDownloadApp = (e: React.MouseEvent) => {
    e.preventDefault();
    const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      window.location.href = "https://play.google.com/store/apps/details?id=com.mrchikoo.learn.twa";
      return;
    }
    const link = document.createElement("a");
    link.href = "/chikoo.apk";
    link.download = "Chikoo-Learn-AI.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      window.open("https://play.google.com/store/apps/details?id=com.mrchikoo.learn.twa", "_blank");
    }, 600);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 py-4 px-6 md:px-12 bg-white/85 backdrop-blur-md border-b border-chikoo-border/60"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative w-10 h-10">
            <Image
              src="/favicon.svg"
              alt="Chikoo Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-2xl font-bold font-heading text-chikoo-blue-deep tracking-tight">
            Chikoo
          </span>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-semibold text-slate-600 hover:text-chikoo-blue transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <a
            href="https://learn.mrchikoo.com"
            className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all active:scale-95 cursor-pointer"
          >
            Explore
          </a>
          <button
            onClick={handleDownloadApp}
            className="px-6 py-2.5 rounded-full bg-chikoo-blue text-white font-semibold text-sm hover:bg-chikoo-blue-dark transition-all hover:shadow-lg hover:shadow-chikoo-blue/30 active:scale-95 cursor-pointer"
          >
            Get App
          </button>
        </div>
      </div>
    </motion.header>
  );
}
