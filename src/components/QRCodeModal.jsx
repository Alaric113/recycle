import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

// 依照路徑規則產生網址
const genUrl = (name, repeat) => {
  const base = window.location.origin;
  const path = window.location.pathname.split('/')[1];
  return repeat
    ? `${base}/${path}/${encodeURIComponent(name)}/cycle`
    : `${base}/${path}/${encodeURIComponent(name)}`;
};

const QRCodeModal = ({ isOpen, onClose, eventName }) => {
  const [repeat, setRepeat] = useState(false);      // ⇦ checkbox 狀態
  const [url, setUrl] = useState('');
  const [img, setImg] = useState('');
  const [loading, setLoading] = useState(false);

  // 每次 eventName 或 repeat 改變時更新網址並重產 QR
  useEffect(() => {
    if (!isOpen || !eventName) return;
    const newUrl = genUrl(eventName, repeat);
    setUrl(newUrl);
    makeQR(newUrl);
  }, [isOpen, eventName, repeat]);

  const makeQR = async (theUrl) => {
    setLoading(true);
    try {
      const dataUrl = await QRCode.toDataURL(theUrl, {
        width: 300,
        margin: 2,
        color: { dark: '#1f2937', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      setImg(dataUrl);
    } catch (err) {
      console.error('QR 產生失敗', err);
    } finally {
      setLoading(false);
    }
  };

  /* --------- Modal 內各種操作 ---------- */
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert('網址已複製到剪貼簿！');
    } catch { alert('複製失敗'); }
  };

  const copyImg = async () => {
    try {
      const blob = await (await fetch(img)).blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      alert('QR Code 圖片已複製！');
    } catch { alert('複製失敗'); }
  };

  const downloadImg = () => {
    const a = document.createElement('a');
    a.download = `${eventName}${repeat ? '-cycle' : ''}-qrcode.png`;
    a.href = img;
    a.click();
  };
  /* -------------------------------------- */

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-center mb-2">{eventName}</h2>

        {/* 重複網址開關 */}
        <label className="flex items-center justify-center gap-2 mb-4 select-none">
          <input
            type="checkbox"
            checked={repeat}
            onChange={(e) => setRepeat(e.target.checked)}
            className="h-4 w-4 accent-purple-600"
          />
          <span className="text-sm">
            <b>可重複</b>
          </span>
        </label>

        {loading ? (
          <div className="flex flex-col items-center py-10">
            <div className="animate-spin h-10 w-10 border-b-2 border-purple-500 rounded-full" />
            <p className="mt-2 text-gray-500">生成中…</p>
          </div>
        ) : (
          <img src={img} alt="QR Code" className="mx-auto mb-4 border p-2 rounded" />
        )}

        {/* 顯示目前網址 */}
        <div className="bg-gray-100 text-xs break-all p-2 rounded mb-4">{url}</div>

        {/* 操作按鈕 */}
        <div className="flex flex-col gap-2">
          <button
            onClick={copyUrl}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            🔗 複製網址
          </button>
          <div className="flex gap-2">
            <button
              onClick={downloadImg}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={!img}
            >
              📥 下載圖片
            </button>
            <button
              onClick={copyImg}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={!img}
            >
              📋 複製圖片
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
