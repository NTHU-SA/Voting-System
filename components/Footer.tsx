"use client";

import Link from "next/link";
import { Heart, Github, Mail, Facebook, Instagram } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* About Section */}
          <div className="md:col-span-2">
            <h3 className="mb-4 text-xl font-bold">
              國立清華大學學生會投票系統
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              由國立清華大學學生會資訊處開發的現代化線上投票平台，提供安全、透明、便捷的投票體驗。
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a
                href="mailto:it@nthusa.tw"
                className="hover:text-foreground transition-colors"
              >
                it@nthusa.tw
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">快速連結</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  首頁
                </Link>
              </li>
              <li>
                <Link
                  href="/vote"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  投票活動
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/NTHU-SA/Voting-System"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  開源專案
                </a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">追蹤我們</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://www.facebook.com/nthusa/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Facebook className="h-4 w-4" />
                  <span>Facebook</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/nthu_sa/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                  <span>Instagram</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/NTHU-SA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="h-4 w-4" />
                  <span>GitHub</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
            <p>© {currentYear} 34th 國立清華大學學生會 版權所有</p>
            <p className="flex items-center gap-1.5">
              Made with <Heart className="h-4 w-4 text-red-500 fill-red-500" />{" "}
              by NTHUSA IT Team
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
