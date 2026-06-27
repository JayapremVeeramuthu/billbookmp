import { QRCodeSVG } from 'qrcode.react';

interface QRCodeBlockProps {
  url: string;
  size?: number;
}

export function QRCodeBlock({ url, size = 90 }: QRCodeBlockProps) {
  return (
    <div className="qr-code-block flex flex-col items-center">
      <QRCodeSVG
        value={url}
        size={size}
        level="M"
        includeMargin={false}
        bgColor="transparent"
        fgColor="#1a237e"
      />
    </div>
  );
}
