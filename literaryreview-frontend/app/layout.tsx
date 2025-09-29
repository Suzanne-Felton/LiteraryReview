import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: "Literary Review | 文学作品评选",
  description: "基于 FHE 的匿名文学作品评选平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        {/* 浮动装饰球 */}
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
        
        {/* 顶部导航 */}
        <header className="sticky top-0 z-50 glass border-0 border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">LR</span>
              </div>
              <div className="text-xl font-bold text-gradient">Literary Review</div>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="nav-link text-white/80 hover:text-white font-medium">
                🏆 评选大厅
              </Link>
              <Link href="/submit" className="nav-link text-white/80 hover:text-white font-medium">
                ✍️ 投稿中心
              </Link>
              <Link href="/board" className="nav-link text-white/80 hover:text-white font-medium">
                📊 排行榜
              </Link>
            </nav>
            <div className="flex items-center space-x-3">
              <div className="hidden md:block text-xs text-white/50">
                Sepolia Testnet
              </div>
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
            </div>
          </div>
        </header>

        {/* 主要内容 */}
        <main className="relative z-10">
          <div className="mx-auto max-w-7xl px-6 py-12">
            {children}
          </div>
        </main>

        {/* 页脚 */}
        <footer className="relative z-10 mt-20 glass border-0 border-t border-white/10">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="text-sm text-white/60">
                © {new Date().getFullYear()} Literary Review. Powered by FHEVM & Zama.
              </div>
              <div className="flex items-center space-x-4 text-xs text-white/40">
                <span>合约: 0x99cb...44Fd</span>
                <span>•</span>
                <span>链ID: 11155111</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}