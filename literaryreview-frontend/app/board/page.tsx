"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { LiteraryReviewABI } from "../../abi/LiteraryReviewABI";
import { LiteraryReviewAddresses } from "../../abi/LiteraryReviewAddresses";
import { RelayerSDKLoader } from "../../fhevm/internal/RelayerSDKLoader";
import { useFhevm } from "../../fhevm/useFhevm";

export default function BoardPage() {
  const [provider, setProvider] = useState<any>();
  const [chainId, setChainId] = useState<number>();
  const [connected, setConnected] = useState<boolean>(false);
  const [userAddress, setUserAddress] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [award, setAward] = useState<string>("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [decrypted, setDecrypted] = useState(false);

  useEffect(() => { new RelayerSDKLoader().load().catch(() => {}); }, []);
  const fhe = useFhevm({ provider, chainId });

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

  const refresh = async () => {
    if (!provider || !contractAddress || !connected) return;
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
          title: row[2], 
          author: row[1],
          awards: row[6], 
          applauseHandle: row[8],
          votes: null,
          applause: null
        });
      }
      setItems(rows);
      setDecrypted(false);
      setMsg("✅ 数据刷新成功");
    } catch (e: any) {
      setMsg("❌ 加载失败: " + e?.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { 
    if (contractAddress && connected) refresh(); 
  }, [contractAddress, connected]);

  const decryptVotes = async () => {
    if (!provider || !contractAddress || !fhe.instance || !award.trim() || !connected) {
      setMsg("❌ 请输入奖项名称并确保钱包已连接");
      return;
    }
    setBusy(true);
    try {
      const rp = new ethers.BrowserProvider(provider);
      const c = new ethers.Contract(contractAddress, LiteraryReviewABI.abi, await rp);
      const signer = await rp.getSigner();

      const handles = await Promise.all(items.map(async (it) => {
        const h = await c.getReviewVotes(it.id, award);
        return { id: it.id, handle: h };
      }));

      const ZERO_HANDLE = "0x" + "0".repeat(64);
      const decryptables = handles.filter(h => h.handle && h.handle !== ZERO_HANDLE);

      let res: Record<string, string | number | bigint> = {};
      if (decryptables.length > 0) {
        res = await fhe.decrypt(
          decryptables.map((h) => ({ handle: h.handle, contractAddress })),
          signer
        );
      }

      const ranked = [...items].map((it) => {
        const h = handles.find(x => x.id === it.id);
        if (!h || h.handle === ZERO_HANDLE) {
          return { ...it, votes: 0 };
        }
        const v = Number(res[h.handle] || 0);
        return { ...it, votes: v };
      }).sort((a, b) => (b.votes || 0) - (a.votes || 0));
      
      setItems(ranked);
      setDecrypted(true);
      setMsg(`✅ 已解密 "${award}" 奖项的投票数据`);
    } catch (e: any) {
      setMsg("❌ 解密失败: " + e?.message);
    } finally {
      setBusy(false);
    }
  };

  const decryptApplause = async () => {
    if (!provider || !contractAddress || !fhe.ready || !connected) return;
    setBusy(true);
    try {
      const signer = await (new ethers.BrowserProvider(provider)).getSigner();
      const handles = items.map((it) => ({ id: it.id, handle: it.applauseHandle }));
      
      const res = await fhe.decrypt(
        handles.map((h) => ({ handle: h.handle, contractAddress })),
        signer
      );

      const updated = [...items].map((it) => ({ 
        ...it, 
        applause: Number(res[it.applauseHandle] || 0) 
      }));
      
      setItems(updated);
      setMsg(`✅ 已解密所有作品的掌声数据`);
    } catch (e: any) {
      setMsg("❌ 解密失败: " + e?.message);
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
              <span className="text-2xl">📊</span>
            </div>
            <h2 className="text-2xl font-bold text-gradient mb-2">连接钱包查看榜单</h2>
            <p className="text-white/70">连接您的 MetaMask 钱包查看排行榜</p>
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
    <div className="space-y-8 fade-in">
      {/* 页面标题 */}
      <div className="glass card p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gradient">作品排行榜</h1>
            <p className="text-white/70">解密投票数据，查看作品排名</p>
          </div>
        </div>
        
        {/* 解密控制面板 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-white/80">按奖项解密投票</label>
            <div className="flex space-x-2">
              <input 
                value={award} 
                onChange={(e) => setAward(e.target.value)} 
                placeholder="输入奖项名称 (如: 最佳小说)"
                className="input-field flex-1 py-2 px-3 rounded-lg text-sm"
              />
              <button 
                onClick={decryptVotes} 
                disabled={busy || !award.trim()}
                className="btn-primary py-2 px-4 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {busy ? "解密中..." : "🔓 解密投票"}
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-white/80">解密掌声数据</label>
            <div className="flex space-x-2">
              <button 
                onClick={decryptApplause} 
                disabled={busy}
                className="btn-accent py-2 px-4 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {busy ? "解密中..." : "👏 解密掌声"}
              </button>
              <button 
                onClick={refresh} 
                disabled={busy}
                className="py-2 px-4 rounded-lg border border-white/20 text-white/70 hover:bg-white/5 text-sm"
              >
                🔄 刷新
              </button>
            </div>
          </div>
        </div>

        {msg && (
          <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 text-sm">
            {msg}
          </div>
        )}
      </div>

      {/* 排行榜 */}
      {items.length === 0 ? (
        <div className="glass card p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-white/80 mb-2">暂无数据</h3>
          <p className="text-white/60">还没有作品参与评选</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((it, idx) => (
            <div 
              key={it.id} 
              className={`glass card p-6 transition-all duration-300 ${
                decrypted && idx < 3 ? 'glow border-yellow-500/20' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* 排名徽章 */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                    decrypted && idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                    decrypted && idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                    decrypted && idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                    'bg-gradient-to-br from-purple-500 to-pink-500'
                  }`}>
                    {decrypted ? (
                      idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`
                    ) : (
                      `#${idx + 1}`
                    )}
                  </div>
                  
                  {/* 作品信息 */}
                  <div>
                    <h3 className="text-lg font-semibold text-white">{it.title}</h3>
                    <div className="text-sm text-white/60">
                      作者: {it.author.slice(0, 6)}...{it.author.slice(-4)} • ID: #{it.id}
                    </div>
                  </div>
                </div>

                {/* 数据展示 */}
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="text-white/60">投票数</div>
                    <div className="font-semibold text-lg">
                      {it.votes !== null ? it.votes : '🔒'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-white/60">掌声数</div>
                    <div className="font-semibold text-lg">
                      {it.applause !== null ? it.applause : '🔒'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 奖项标签 */}
              <div className="mt-4 flex flex-wrap gap-2">
                {it.awards?.map((a: string) => (
                  <span 
                    key={a} 
                    className={`tag px-2 py-1 rounded-full text-xs font-medium ${
                      award === a ? 'bg-purple-500/20 border-purple-400/50' : ''
                    }`}
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 说明卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass card p-6">
          <div className="text-2xl mb-3">🔐</div>
          <h3 className="font-semibold mb-2">FHE 加密保护</h3>
          <p className="text-sm text-white/70">
            所有投票和掌声数据都通过全同态加密(FHE)保护，只有授权用户才能解密查看真实数据，确保评选过程的公正性。
          </p>
        </div>
        <div className="glass card p-6">
          <div className="text-2xl mb-3">🏆</div>
          <h3 className="font-semibold mb-2">实时排名</h3>
          <p className="text-sm text-white/70">
            解密后的数据会实时更新排名，前三名作品将获得特殊标识。支持按不同奖项分别查看排行榜。
          </p>
        </div>
      </div>
    </div>
  );
}