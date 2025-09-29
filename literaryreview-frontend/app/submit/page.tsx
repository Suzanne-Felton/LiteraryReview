"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { LiteraryReviewABI } from "../../abi/LiteraryReviewABI";
import { LiteraryReviewAddresses } from "../../abi/LiteraryReviewAddresses";

export default function SubmitPage() {
  const [provider, setProvider] = useState<any>();
  const [chainId, setChainId] = useState<number>();
  const [connected, setConnected] = useState<boolean>(false);
  const [userAddress, setUserAddress] = useState<string>("");
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [content, setContent] = useState("");
  const [genres, setGenres] = useState("");
  const [awards, setAwards] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if ((window as any).ethereum) {
      setProvider((window as any).ethereum);
      checkConnection();
    }
  }, []);

  const checkConnection = async () => {
    if (!(window as any).ethereum) return;
    try {
      const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setConnected(true);
        setUserAddress(accounts[0]);
        const id = await (window as any).ethereum.request({ method: "eth_chainId" });
        setChainId(parseInt(id, 16));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const connectWallet = async () => {
    if (!(window as any).ethereum) {
      setMsg("❌ 请安装 MetaMask");
      return;
    }
    try {
      const accounts = await (window as any).ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      setConnected(true);
      setUserAddress(accounts[0]);
      const id = await (window as any).ethereum.request({ method: "eth_chainId" });
      setChainId(parseInt(id, 16));
      setMsg("✅ 钱包连接成功");
    } catch (e: any) {
      setMsg("❌ 连接失败: " + e.message);
    }
  };

  const contractAddress = useMemo(() => {
    if (!chainId) return undefined;
    const entry = (LiteraryReviewAddresses as any)[chainId.toString()];
    return entry?.address as `0x${string}` | undefined;
  }, [chainId]);

  const submit = async () => {
    if (!provider || !contractAddress || !connected) return;
    if (!title.trim() || !synopsis.trim() || !content.trim()) {
      setMsg("❌ 请填写完整的作品信息");
      return;
    }
    
    setBusy(true);
    try {
      const bp = new ethers.BrowserProvider(provider);
      const s = await bp.getSigner();
      const c = new ethers.Contract(contractAddress, LiteraryReviewABI.abi, s);
      const g = genres.split(",").map((x) => x.trim()).filter(Boolean);
      const a = awards.split(",").map((x) => x.trim()).filter(Boolean);
      
      if (g.length === 0) g.push("未分类");
      if (a.length === 0) a.push("最佳作品");
      
      const tx = await c.uploadManuscript(title, synopsis, content, g, a);
      await tx.wait();
      setMsg("✅ 投稿成功！您的作品已提交至评选平台");
      
      // 清空表单
      setTitle(""); setSynopsis(""); setContent(""); setGenres(""); setAwards("");
    } catch (e: any) {
      setMsg("❌ 投稿失败: " + e?.message);
    } finally { 
      setBusy(false); 
    }
  };

  if (!connected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass card max-w-md w-full p-8 text-center fade-in">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-2xl">✍️</span>
            </div>
            <h2 className="text-2xl font-bold text-gradient mb-2">连接钱包投稿</h2>
            <p className="text-white/70">连接您的 MetaMask 钱包开始投稿</p>
          </div>
          <button
            onClick={connectWallet}
            className="btn-primary w-full py-3 px-6 rounded-xl font-semibold"
          >
            连接 MetaMask
          </button>
          {msg && (
            <div className="mt-4 p-3 rounded-lg bg-white/5 text-sm text-white/80">
              {msg}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto fade-in">
      {/* 页面标题 */}
      <div className="glass card p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-xl">✍️</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gradient">投稿中心</h1>
            <p className="text-white/70">分享您的文学作品，参与匿名评选</p>
          </div>
        </div>
        <div className="mt-4 text-sm text-white/60">
          投稿者: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
        </div>
      </div>

      {/* 投稿表单 */}
      <div className="glass card p-8">
        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/80">
                作品标题 <span className="text-red-400">*</span>
              </label>
              <input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="输入您的作品标题"
                className="input-field w-full py-3 px-4 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/80">
                文学体裁
              </label>
              <input 
                value={genres} 
                onChange={(e) => setGenres(e.target.value)} 
                placeholder="小说,诗歌,散文 (逗号分隔)"
                className="input-field w-full py-3 px-4 rounded-xl"
              />
            </div>
          </div>

          {/* 内容区域 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">
              简介哈希 <span className="text-red-400">*</span>
            </label>
            <input 
              value={synopsis} 
              onChange={(e) => setSynopsis(e.target.value)} 
              placeholder="IPFS 或 Arweave 哈希地址"
              className="input-field w-full py-3 px-4 rounded-xl"
            />
            <div className="text-xs text-white/50">
              💡 建议将作品简介上传至 IPFS 或 Arweave，在此填入哈希地址
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">
              正文/附件哈希 <span className="text-red-400">*</span>
            </label>
            <input 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder="完整作品的存储哈希"
              className="input-field w-full py-3 px-4 rounded-xl"
            />
            <div className="text-xs text-white/50">
              💡 将完整作品上传至分布式存储，填入哈希地址确保作品永久保存
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">
              参评奖项
            </label>
            <input 
              value={awards} 
              onChange={(e) => setAwards(e.target.value)} 
              placeholder="最佳小说,最佳诗歌,年度作品 (逗号分隔)"
              className="input-field w-full py-3 px-4 rounded-xl"
            />
            <div className="text-xs text-white/50">
              💡 选择您希望参与评选的奖项类别，可多选
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 pt-6 border-t border-white/10">
            <div className="text-sm text-white/60">
              📝 投稿后作品将进入匿名评选，掌声和投票数据使用 FHE 加密保护
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => {
                  setTitle(""); setSynopsis(""); setContent(""); setGenres(""); setAwards(""); setMsg("");
                }}
                className="py-3 px-6 rounded-xl border border-white/20 text-white/70 hover:bg-white/5 transition-all"
              >
                清空表单
              </button>
              <button 
                disabled={busy} 
                onClick={submit} 
                className="btn-primary py-3 px-8 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? "提交中..." : "🚀 立即投稿"}
              </button>
            </div>
          </div>

          {/* 消息提示 */}
          {msg && (
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 text-sm">
              {msg}
            </div>
          )}
        </div>
      </div>

      {/* 投稿指南 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="glass card p-6 text-center">
          <div className="text-3xl mb-3">🔒</div>
          <h3 className="font-semibold mb-2">匿名保护</h3>
          <p className="text-sm text-white/70">投票数据通过 FHE 加密，确保评选公正透明</p>
        </div>
        <div className="glass card p-6 text-center">
          <div className="text-3xl mb-3">🌐</div>
          <h3 className="font-semibold mb-2">永久存储</h3>
          <p className="text-sm text-white/70">作品存储在分布式网络，永不丢失</p>
        </div>
        <div className="glass card p-6 text-center">
          <div className="text-3xl mb-3">🏆</div>
          <h3 className="font-semibold mb-2">公平评选</h3>
          <p className="text-sm text-white/70">基于区块链的透明评选机制</p>
        </div>
      </div>
    </div>
  );
}