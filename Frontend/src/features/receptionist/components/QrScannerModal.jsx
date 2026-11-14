import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, ImagePlus, Keyboard, QrCode, RefreshCw, X, AlertCircle } from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { parseMemberQrPayload } from '../receptionistUtils';

/**
 * QR check-in modal for receptionists supporting live webcam scanning,
 * uploaded QR screenshots, and manual / USB scanner code entry.
 */
const QrScannerModal = ({ isOpen, onClose, onDetected }) => {
  useLanguage();
  const [mode, setMode] = useState('camera'); // 'camera' | 'upload'
  const [cameraState, setCameraState] = useState('starting'); // 'starting' | 'ready' | 'error'
  const [scanError, setScanError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [retrySeed, setRetrySeed] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const fileInputRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleCandidateText = useCallback((rawText) => {
    const parsed = parseMemberQrPayload(rawText);
    if (!parsed) {
      setScanError(t('Invalid QR code or not a NEXUS member pass: {0}', [String(rawText || '').slice(0, 60)]));
      return false;
    }
    stopCamera();
    onDetected(parsed);
    return true;
  }, [onDetected, stopCamera]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return undefined;
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      stopCamera();
    };
  }, [isOpen, onClose, stopCamera]);

  useEffect(() => {
    if (!isOpen || mode !== 'camera') {
      stopCamera();
      return undefined;
    }

    let cancelled = false;
    let lastDecodeTs = 0;

    const startScanner = async () => {
      setCameraState('starting');
      setScanError('');

      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraState('error');
        setScanError(t('Camera is not supported in this browser context. Please upload a QR image or enter the code manually.'));
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const videoEl = videoRef.current;
        if (!videoEl) return;
        videoEl.srcObject = stream;
        await videoEl.play();

        if (cancelled) return;
        setCameraState('ready');

        const scanFrame = (timestamp) => {
          if (cancelled) return;
          if (timestamp - lastDecodeTs >= 150 && videoEl.readyState >= videoEl.HAVE_ENOUGH_DATA) {
            lastDecodeTs = timestamp;
            const width = videoEl.videoWidth;
            const height = videoEl.videoHeight;
            if (width > 0 && height > 0) {
              const canvas = canvasRef.current || document.createElement('canvas');
              canvasRef.current = canvas;
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(videoEl, 0, 0, width, height);
                const imgData = ctx.getImageData(0, 0, width, height);
                const code = jsQR(imgData.data, width, height, { inversionAttempts: 'attemptBoth' });
                if (code?.data && handleCandidateText(code.data)) {
                  return;
                }
              }
            }
          }
          rafRef.current = requestAnimationFrame(scanFrame);
        };

        rafRef.current = requestAnimationFrame(scanFrame);
      } catch (err) {
        if (cancelled) return;
        setCameraState('error');
        const denied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
        setScanError(
          denied
            ? t('Camera permission was denied. Please allow camera access or upload a QR photo instead.')
            : t('Could not access webcam. You can upload a QR screenshot or type the pass code below.')
        );
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [isOpen, mode, retrySeed, handleCandidateText, stopCamera]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError('');

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const maxSide = 1024;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = canvasRef.current || document.createElement('canvas');
        canvasRef.current = canvas;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const code = jsQR(imgData.data, width, height, { inversionAttempts: 'attemptBoth' });
        if (!code?.data) {
          setScanError(t('No QR code was detected in the selected image. Please try a clearer photo.'));
        } else {
          handleCandidateText(code.data);
        }
      } catch {
        setScanError(t('Unable to read the selected image file.'));
      } finally {
        URL.revokeObjectURL(objectUrl);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setScanError(t('Unable to load the selected image file.'));
    };
    img.src = objectUrl;
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    setScanError('');
    handleCandidateText(manualCode);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '470px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '1.1rem',
          padding: '1.25rem',
          boxShadow: '0 24px 48px rgba(0,0,0,0.28)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '0.75rem',
                backgroundColor: 'var(--primary-soft)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrCode style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text)' }}>
                {t('Scan Member QR Pass')}
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {t('Hold member QR pass up to the webcam or upload a QR photo.')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('Close')}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '999px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Mode Switcher */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.45rem',
            padding: '0.25rem',
            borderRadius: '0.75rem',
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setScanError('');
              setMode('camera');
            }}
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '0.55rem',
              border: 'none',
              backgroundColor: mode === 'camera' ? 'var(--primary)' : 'transparent',
              color: mode === 'camera' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
            }}
          >
            <Camera style={{ width: '15px', height: '15px' }} />
            {t('Webcam Scanner')}
          </button>
          <button
            type="button"
            onClick={() => {
              setScanError('');
              setMode('upload');
            }}
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '0.55rem',
              border: 'none',
              backgroundColor: mode === 'upload' ? 'var(--primary)' : 'transparent',
              color: mode === 'upload' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
            }}
          >
            <ImagePlus style={{ width: '15px', height: '15px' }} />
            {t('Upload QR Image')}
          </button>
        </div>

        {/* Scanner Area */}
        {mode === 'camera' ? (
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4 / 3',
              borderRadius: '0.9rem',
              overflow: 'hidden',
              backgroundColor: '#0f172a',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: cameraState === 'ready' ? 'block' : 'none',
              }}
            />

            {cameraState === 'ready' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '62%',
                    height: '68%',
                    borderRadius: '1rem',
                    border: '2px dashed rgba(56, 189, 248, 0.9)',
                    boxShadow: '0 0 0 999px rgba(15, 23, 42, 0.35)',
                  }}
                />
              </div>
            )}

            {cameraState === 'starting' && (
              <div style={{ color: '#cbd5e1', textAlign: 'center', padding: '1rem', fontSize: '0.82rem' }}>
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                <div>{t('Starting webcam...')}</div>
              </div>
            )}

            {cameraState === 'error' && (
              <div style={{ color: '#e2e8f0', textAlign: 'center', padding: '1.25rem', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
                <Camera style={{ width: '28px', height: '28px', opacity: 0.7 }} />
                <span>{t('Camera unavailable')}</span>
                <button
                  type="button"
                  onClick={() => setRetrySeed((s) => s + 1)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '0.55rem',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t('Retry Camera')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <label
            style={{
              padding: '2rem 1rem',
              borderRadius: '0.9rem',
              border: '2px dashed var(--border)',
              backgroundColor: 'var(--bg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.55rem',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '0.8rem',
                backgroundColor: 'var(--primary-soft)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ImagePlus style={{ width: '22px', height: '22px' }} />
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text)' }}>
              {t('Click to choose QR image from device')}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {t('Supports PNG, JPG, WEBP screenshots of Member QR Pass.')}
            </div>
          </label>
        )}

        {/* Scan Error */}
        {scanError && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '0.65rem',
              backgroundColor: 'var(--danger-soft)',
              color: 'var(--danger-text)',
              border: '1px solid var(--border)',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            <span>{scanError}</span>
          </div>
        )}

        {/* Manual / USB Scanner Code Entry */}
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Keyboard style={{ width: '13px', height: '13px' }} />
            {t('Or enter / scan pass code directly')}
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="NEXUS-PASS-9906..."
              style={{
                flex: 1,
                padding: '0.55rem 0.75rem',
                borderRadius: '0.6rem',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.82rem',
              }}
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              style={{
                padding: '0.55rem 0.95rem',
                borderRadius: '0.6rem',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: manualCode.trim() ? 'pointer' : 'not-allowed',
                opacity: manualCode.trim() ? 1 : 0.55,
              }}
            >
              {t('Verify')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QrScannerModal;
