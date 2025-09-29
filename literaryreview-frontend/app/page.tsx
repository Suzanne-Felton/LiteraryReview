"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { LiteraryReviewABI } from "../abi/LiteraryReviewABI";
import { LiteraryReviewAddresses } from "../abi/LiteraryReviewAddresses";
import { RelayerSDKLoader } from "../fhevm/internal/RelayerSDKLoader";
import { useFhevm } from "../fhevm/useFhevm";

export default function HomePage() {
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>();
  const [chainId, setChainId] = useState<number | undefined>();
  const [message, setMessage] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [userAddress, setUserAddress] = useState<string>("");

  const fhe = useFhevm({ provider, chainId });

  useEffect(() => {
    new RelayerSDKLoader().load().catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
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
      setMessage("❌ 请安装 MetaMask");
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
      setMessage("✅ 钱包连接成功");
    } catch (e: any) {
      setMessage("❌ 连接失败: " + e.message);
    }
  };

  const contractAddress = useMemo(() => {
    if (!chainId) return undefined;
    const entry = (LiteraryReviewAddresses as any)[chainId.toString()];
    return entry?.address as `0x${string}` | undefined;
  }, [chainId]);

  const refresh = async () => {
    if (!provider || !contractAddress) return;
    setBusy(true);
    try {
      const rp = new ethers.BrowserProvider(provider);
      const c = new ethers.Contract(contractAddress, LiteraryReviewABI.abi, await rp);
      const ids: bigint[] = await c.getAllManuscripts();
      const rows: any[] = [];
      for (const idb of ids) {
        const id = Number(idb);
        const row = await c.getManuscript(id);
        rows.push({
          id: Number(row[0]),
          author: row[1],
          title: row[2],
          synopsisHash: row[3],
          contentHash: row[4],
          genres: row[5],
          awards: row[6],
          timestamp: Number(row[7]),
          applauseHandle: row[8],
        });
      }
      rows.sort((a, b) => b.timestamp - a.timestamp);
      setItems(rows);
      setMessage("✅ 数据刷新成功");
    } catch (e: any) {
      setMessage("❌ 加载失败: " + e?.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { 
    if (contractAddress && connected) refresh(); 
  }, [contractAddress, connected]);

  const applaud = async (id: number) => {
    if (!provider || !contractAddress || !connected) return;
    setBusy(true);
    try {
      const bp = new ethers.BrowserProvider(provider);
      const s = await bp.getSigner();
      const c = new ethers.Contract(contractAddress, LiteraryReviewABI.abi, s);
      const tx = await c.applaudManuscript(id);
      await tx.wait();
      setMessage(`👏 稿件 #${id} 获得您的掌声！`);
      await refresh();
    } catch (e: any) {
      setMessage("❌ 操作失败: " + e?.message);
    } finally {
      setBusy(false);
    }
  };

  const vote = async (id: number, award: string) => {
    if (!provider || !contractAddress || !connected) return;
    setBusy(true);
    try {
      const bp = new ethers.BrowserProvider(provider);
      const s = await bp.getSigner();
      const c = new ethers.Contract(contractAddress, LiteraryReviewABI.abi, s);
      const tx = await c.castReviewVote(id, award);
      await tx.wait();
      setMessage(`✅ 已为稿件 #${id} 投票：${award}`);
    } catch (e: any) {
      setMessage("❌ 投票失败: " + e?.message);
    } finally {
      setBusy(false);
    }
  };

  const decryptApplause = async (id: number) => {
    if (!provider || !contractAddress || !connected) {
      setMessage("❌ 请先连接钱包");
      return;
    }
    
    if (!fhe.ready) {
      setMessage("❌ FHE 实例未准备就绪，请稍后重试");
      return;
    }
    
    setBusy(true);
    setMessage("🔄 正在解密掌声数据...");
    
    try {
      const row = items.find((r) => r.id === id);
      if (!row) {
        setMessage("❌ 未找到对应作品");
        return;
      }
      
      console.log("Decrypting applause for manuscript:", id, "handle:", row.applauseHandle);
      
      const bp = new ethers.BrowserProvider(provider);
      const signer = await bp.getSigner();
      
      const result = await fhe.decrypt(
        [{ handle: row.applauseHandle, contractAddress }],
        signer
      );
      
      const applauseCount = result[row.applauseHandle];
      setMessage(`🔓 稿件 #${id} 掌声数: ${applauseCount}`);
      
    } catch (e: any) {
      console.error("Decryption error:", e);
      setMessage(`❌ 解密失败: ${e?.message || "未知错误"}`);
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
              <span className="text-2xl">🔗</span>
            </div>
            <h2 className="text-2xl font-bold text-gradient mb-2">连接钱包</h2>
            <p className="text-white/70">连接您的 MetaMask 钱包开始使用文学评选平台</p>
          </div>
          <button
            onClick={connectWallet}
            className="btn-primary w-full py-3 px-6 rounded-xl font-semibold"
          >
            连接 MetaMask
          </button>
          {message && (
            <div className="mt-4 p-3 rounded-lg bg-white/5 text-sm text-white/80">
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* 顶部状态栏 */}
      <section className="glass card p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">文学作品评选大厅</h1>
            <p className="text-white/70">发现优秀作品，为您心仪的文学作品投票</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-white/60">
              <div>用户: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}</div>
              <div>作品数: {items.length}</div>
              <div className="flex items-center space-x-2">
                <span>FHE:</span>
                <div className={`h-2 w-2 rounded-full ${
                  fhe.ready ? 'bg-green-400' : 
                  fhe.loading ? 'bg-yellow-400 animate-pulse' : 
                  'bg-red-400'
                }`}></div>
                <span className="text-xs">
                  {fhe.ready ? '就绪' : fhe.loading ? '加载中' : '未就绪'}
                </span>
              </div>
              {fhe.error && (
                <div className="text-xs text-red-400">FHE错误: {fhe.error}</div>
              )}
            </div>
            <button 
              onClick={refresh} 
              disabled={busy}
              className="btn-primary py-2 px-4 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {busy ? "🔄" : "🔄"} 刷新
            </button>
          </div>
        </div>
        {message && (
          <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 text-sm">
            {message}
          </div>
        )}
        
        {/* 调试信息 */}
        <div className="mt-4 text-xs text-white/40 space-y-1">
          <div>Chain ID: {chainId || "未连接"}</div>
          <div>Contract: {contractAddress ? `${contractAddress.slice(0, 10)}...` : "未找到"}</div>
          <div>RelayerSDK: {typeof window !== "undefined" && (window as any).relayerSDK ? "已加载" : "未加载"}</div>
        </div>
      </section>

      {/* 作品网格 */}
      {items.length === 0 ? (
        <div className="glass card p-12 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-white/80 mb-2">暂无作品</h3>
          <p className="text-white/60">成为第一个投稿的作者吧！</p>
          <Link href="/submit" className="inline-block mt-4 btn-primary py-2 px-6 rounded-lg font-medium">
            立即投稿
          </Link>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((m, index) => (
            <article 
              key={m.id} 
              className="glass card p-6 hover:glow"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* 作品头部 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white mb-1 line-clamp-2">{m.title}</h2>
                  <div className="text-xs text-white/50">
                    #{m.id} • 作者: {m.author.slice(0, 6)}...{m.author.slice(-4)}
                  </div>
                </div>
                <div className="text-xs text-white/40">
                  {new Date(m.timestamp * 1000).toLocaleDateString()}
                </div>
              </div>

              {/* 体裁标签 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {m.genres?.slice(0, 3).map((g: string) => (
                  <span key={g} className="tag px-2 py-1 rounded-full text-xs font-medium">
                    {g}
                  </span>
                ))}
                {m.genres?.length > 3 && (
                  <span className="tag px-2 py-1 rounded-full text-xs text-white/60">
                    +{m.genres.length - 3}
                  </span>
                )}
              </div>

              {/* 简介 */}
              <div className="mb-4 text-sm text-white/70 line-clamp-2">
                简介: {m.synopsisHash || "暂无简介"}
              </div>

              {/* 操作按钮 */}
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <button 
                    disabled={busy} 
                    onClick={() => applaud(m.id)} 
                    className="btn-secondary flex-1 py-2 px-3 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    👏 掌声
                  </button>
                  <button 
                    disabled={busy || !fhe.ready} 
                    onClick={() => decryptApplause(m.id)} 
                    className="btn-accent py-2 px-3 rounded-lg text-sm font-medium disabled:opacity-50"
                    title={!fhe.ready ? "FHE 实例未就绪" : "解密掌声数"}
                  >
                    🔓
                  </button>
                </div>

                {/* 投票区域 */}
                <div className="flex space-x-2">
                  <select 
                    id={`award-${m.id}`} 
                    className="input-field flex-1 py-2 px-3 rounded-lg text-sm"
                  >
                    {m.awards?.map((a: string) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <button 
                    disabled={busy} 
                    onClick={() => {
                      const sel = document.querySelector(`#award-${m.id}`) as HTMLSelectElement;
                      const val = sel?.value || m.awards?.[0];
                      vote(m.id, val);
                    }} 
                    className="btn-primary py-2 px-4 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    投票
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}