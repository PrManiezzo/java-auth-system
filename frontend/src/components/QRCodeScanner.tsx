import { useEffect, useRef, useState } from "react";

interface QRCodeScannerProps {
    onScan: (data: string) => void;
    onError?: (error: string) => void;
    active?: boolean;
}

export function QRCodeScanner({ onScan, onError, active = true }: QRCodeScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasCamera, setHasCamera] = useState(true);
    const [scanning, setScanning] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);
    const scanningRef = useRef(false);

    useEffect(() => {
        if (!active) {
            stopScanning();
            return;
        }

        startCamera();

        return () => {
            stopScanning();
        };
    }, [active]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setHasCamera(true);
                setScanning(true);
                scanningRef.current = true;
                requestAnimationFrame(tick);
            }
        } catch (err) {
            setHasCamera(false);
            onError?.("Não foi possível acessar a câmera");
        }
    };

    const stopScanning = () => {
        scanningRef.current = false;
        setScanning(false);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    };

    const tick = () => {
        if (!scanningRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
            const context = canvas.getContext("2d");
            if (!context) return;

            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = detectQRCode(imageData);

            if (code) {
                onScan(code);
                // Pause briefly after successful scan
                scanningRef.current = false;
                setTimeout(() => {
                    scanningRef.current = true;
                    requestAnimationFrame(tick);
                }, 1000);
                return;
            }
        }

        requestAnimationFrame(tick);
    };

    const detectQRCode = (imageData: ImageData): string | null => {
        // This is a simplified QR code detection
        // For production, use a library like jsQR or @zxing/browser
        // For now, we'll use a manual input as fallback
        return null;
    };

    if (!hasCamera) {
        return (
            <div style={{ padding: "20px", textAlign: "center", background: "var(--bg-card)", borderRadius: "12px" }}>
                <p style={{ color: "var(--danger)", marginBottom: "12px" }}>
                    ⚠ Câmera não disponível
                </p>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    Por favor, permita o acesso à câmera ou digite o código manualmente.
                </p>
            </div>
        );
    }

    return (
        <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", background: "#000" }}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", display: "block", maxHeight: "400px", objectFit: "cover" }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            {scanning && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        border: "3px solid var(--accent)",
                        width: "250px",
                        height: "250px",
                        borderRadius: "12px",
                        pointerEvents: "none",
                    }}
                />
            )}
            <div
                style={{
                    position: "absolute",
                    bottom: "16px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(0,0,0,0.7)",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    color: "white",
                    fontSize: "13px",
                }}
            >
                📷 Posicione o QR Code na área marcada
            </div>
        </div>
    );
}

interface ManualQRInputProps {
    onSubmit: (code: string) => void;
    placeholder?: string;
}

export function ManualQRInput({ onSubmit, placeholder = "Digite ou cole o código QR" }: ManualQRInputProps) {
    const [value, setValue] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) {
            onSubmit(value.trim());
            setValue("");
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                style={{ flex: 1 }}
            />
            <button type="submit" className="btn-secondary">
                Buscar
            </button>
        </form>
    );
}
