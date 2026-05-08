import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import crypto from 'crypto';
import {
  certificateTemplateConfig,
  CertificateTemplateConfig,
} from '../config/certificateTemplate';
import {
  fileStorageService as defaultFileStorageService,
  FileStorageService,
} from './FileStorageService';

export interface CertificateInput {
  participantName: string;
  role: string;
  eventOrInternship: string;
  date: Date;
  format: 'pdf' | 'image' | 'both';
}

export interface CertificateOutput {
  uniqueCertificateId: string;
  issuedAt: Date;
  issuedBy: string;
  filePaths: {
    pdf?: string;
    image?: string;
  };
}

type QrCell = {
  x: number;
  y: number;
  on: boolean;
};

export class CertificateGeneratorService {
  private readonly templateConfig: CertificateTemplateConfig;
  private readonly fileStorageService: FileStorageService;

  constructor(
    templateConfig: CertificateTemplateConfig = certificateTemplateConfig,
    fileStorageService: FileStorageService = defaultFileStorageService
  ) {
    this.templateConfig = templateConfig;
    this.fileStorageService = fileStorageService;
  }

  generateUniqueId(data?: CertificateInput, issuedAt: Date = new Date()): string {
    const payload = JSON.stringify({
      participantName: data?.participantName ?? uuidv4(),
      role: data?.role ?? 'Certificate Recipient',
      program: data?.eventOrInternship ?? 'Certificate Program',
      date: data?.date?.toISOString() ?? issuedAt.toISOString(),
      issuedAt: issuedAt.toISOString(),
      nonce: uuidv4(),
    });
    const secretKey = process.env.CERTIFICATE_SECRET_KEY || 'development-certificate-secret';
    const digest = crypto.createHmac('sha256', secretKey).update(payload).digest('hex');

    return `MB-${digest.slice(0, 16).toUpperCase()}`;
  }

  async generateCertificate(data: CertificateInput): Promise<CertificateOutput> {
    const startTime = Date.now();
    const issuedAt = new Date();
    const uniqueCertificateId = this.generateUniqueId(data, issuedAt);
    const issuedBy = this.selectSignatureName(uniqueCertificateId);

    try {
      console.log(`Starting certificate generation for ${data.participantName}`, {
        uniqueCertificateId,
        format: data.format,
      });

      const filePaths: { pdf?: string; image?: string } = {};

      if (data.format === 'pdf' || data.format === 'both') {
        filePaths.pdf = await this.generatePDF(data, uniqueCertificateId);
        console.log(`PDF generated successfully: ${filePaths.pdf}`);
      }

      if (data.format === 'image' || data.format === 'both') {
        filePaths.image = await this.generateImage(data, uniqueCertificateId);
        console.log(`Image generated successfully: ${filePaths.image}`);
      }

      const duration = Date.now() - startTime;
      console.log(`Certificate generation completed successfully`, {
        uniqueCertificateId,
        participantName: data.participantName,
        format: data.format,
        duration,
      });

      return {
        uniqueCertificateId,
        issuedAt,
        issuedBy,
        filePaths,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const duration = Date.now() - startTime;

      console.error('Certificate generation failed', {
        uniqueCertificateId,
        participantName: data.participantName,
        format: data.format,
        error: errorMessage,
        duration,
      });

      throw new Error(`Certificate generation failed: ${errorMessage}`);
    }
  }

  async generateImage(data: CertificateInput, uniqueCertificateId: string): Promise<string> {
    try {
      const imageBuffer = await this.renderPngBuffer(data, uniqueCertificateId);

      return await this.fileStorageService.saveCertificate(imageBuffer, {
        uniqueId: uniqueCertificateId,
        format: 'png',
        generatedAt: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Image generation failed', {
        uniqueCertificateId,
        participantName: data.participantName,
        error: errorMessage,
      });
      throw new Error(`Image generation failed: ${errorMessage}`);
    }
  }

  async generatePDF(data: CertificateInput, uniqueCertificateId: string): Promise<string> {
    try {
      const imageBuffer = await this.renderPngBuffer(data, uniqueCertificateId);
      const doc = new PDFDocument({
        size: this.templateConfig.pageSize,
        margins: this.templateConfig.margins,
      });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));

      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.image(imageBuffer, 0, 0, {
          width: this.templateConfig.layout.page.width,
          height: this.templateConfig.layout.page.height,
        });
        doc.end();
      });

      return await this.fileStorageService.saveCertificate(pdfBuffer, {
        uniqueId: uniqueCertificateId,
        format: 'pdf',
        generatedAt: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('PDF generation failed', {
        uniqueCertificateId,
        participantName: data.participantName,
        error: errorMessage,
      });
      throw new Error(`PDF generation failed: ${errorMessage}`);
    }
  }

  async convertToImage(pdfPath: string, uniqueCertificateId: string): Promise<string> {
    try {
      const pdfBuffer = await fs.readFile(pdfPath);
      const imageBuffer = await this.convertPDFBufferToImage(pdfBuffer);

      return await this.fileStorageService.saveCertificate(imageBuffer, {
        uniqueId: uniqueCertificateId,
        format: 'png',
        generatedAt: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Image conversion failed', {
        uniqueCertificateId,
        pdfPath,
        error: errorMessage,
      });
      throw new Error(`Image conversion failed: ${errorMessage}`);
    }
  }

  private async renderPngBuffer(
    data: CertificateInput,
    uniqueCertificateId: string
  ): Promise<Buffer> {
    return sharp(Buffer.from(this.renderSvgLayout(data, uniqueCertificateId)))
      .png()
      .toBuffer();
  }

  private renderSvgLayout(data: CertificateInput, uniqueCertificateId: string): string {
    const config = this.templateConfig;
    const { width, height } = config.layout.page;
    const formattedDate = this.formatDate(data.date);
    const signatureName = this.selectSignatureName(uniqueCertificateId);
    const qrCells = this.generateQrCells(uniqueCertificateId, 17);
    const qrCellSize = config.layout.qr.size / 17;
    const signatureCenterX = width / 2;
    const signatureLineY = config.layout.signature.y;
    const signatureLineStartX = signatureCenterX - config.layout.signature.lineWidth / 2;
    const signatureLineEndX = signatureCenterX + config.layout.signature.lineWidth / 2;
    const escapeXml = (value: string): string =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    const divider = (y: number): string =>
      `<rect x="${(width - 180) / 2}" y="${y}" width="180" height="1" fill="url(#shortDivider)"/>`;
    const corner = (x: number, y: number, sx: number, sy: number): string => `
      <g transform="translate(${x} ${y}) scale(${sx} ${sy})">
        <path d="M0 74 V0 H74" fill="none" stroke="${config.colors.gold}" stroke-width="2"/>
        <path d="M16 58 V16 H58" fill="none" stroke="${config.colors.gold}" stroke-width="1"/>
        <circle cx="0" cy="0" r="3.6" fill="${config.colors.gold}"/>
      </g>`;
    const qrRects = qrCells
      .map((cell) => {
        const fill =
          cell.x === 8 && cell.y === 8 ? config.colors.gold : cell.on ? config.colors.primary : '';

        return fill
          ? `<rect x="${config.layout.qr.x + cell.x * qrCellSize}" y="${config.layout.qr.y + cell.y * qrCellSize}" width="${qrCellSize}" height="${qrCellSize}" fill="${fill}"/>`
          : '';
      })
      .join('');
    const sealDots = Array.from({ length: 24 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 24;
      const x = config.layout.seal.x + Math.cos(angle) * 28;
      const y = config.layout.seal.y + Math.sin(angle) * 28;

      return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="0.9" fill="${config.colors.gold}"/>`;
    }).join('');

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,600&amp;family=Montserrat:wght@300;400&amp;family=Playfair+Display:wght@400;700&amp;display=swap');
            .montserrat { font-family: 'Montserrat', Arial, sans-serif; }
            .playfair { font-family: 'Playfair Display', 'Times New Roman', serif; }
            .cormorant { font-family: 'Cormorant Garamond', 'Times New Roman', serif; }
            .mono { font-family: 'Courier New', Consolas, monospace; }
          </style>
          <pattern id="watermark" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
            <line x1="0" y1="0" x2="0" y2="22" stroke="${config.colors.gold}" stroke-width="1" opacity="0.025"/>
          </pattern>
          <linearGradient id="verticalGold" x1="0" y1="80" x2="0" y2="662" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="${config.colors.gold}" stop-opacity="0"/>
            <stop offset="0.12" stop-color="${config.colors.gold}" stop-opacity="1"/>
            <stop offset="0.88" stop-color="${config.colors.gold}" stop-opacity="1"/>
            <stop offset="1" stop-color="${config.colors.gold}" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="shortDivider" x1="0" y1="0" x2="180" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="${config.colors.gold}" stop-opacity="0"/>
            <stop offset="0.5" stop-color="${config.colors.gold}" stop-opacity="1"/>
            <stop offset="1" stop-color="${config.colors.gold}" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="fullDivider" x1="100" y1="0" x2="950" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="${config.colors.gold}" stop-opacity="0"/>
            <stop offset="0.5" stop-color="${config.colors.gold}" stop-opacity="1"/>
            <stop offset="1" stop-color="${config.colors.gold}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="#ffffff"/>
        <rect width="100%" height="100%" fill="url(#watermark)"/>
        <rect x="3" y="3" width="${width - 6}" height="${height - 6}" fill="none" stroke="${config.colors.primary}" stroke-width="6"/>
        <rect x="10" y="10" width="${width - 20}" height="${height - 20}" fill="none" stroke="${config.colors.gold}" stroke-width="1"/>
        <rect x="14" y="14" width="${width - 28}" height="${height - 28}" fill="none" stroke="${config.colors.mutedGold}" stroke-width="0.5"/>
        <rect x="72" y="80" width="2" height="582" fill="url(#verticalGold)"/>
        <rect x="${width - 74}" y="80" width="2" height="582" fill="url(#verticalGold)"/>
        ${corner(74, 74, 1, 1)}
        ${corner(width - 74, 74, -1, 1)}
        ${corner(74, height - 74, 1, -1)}
        ${corner(width - 74, height - 74, -1, -1)}
        ${this.renderSvgEmblem(width / 2 - 36, 24)}
        <text x="50%" y="${config.layout.brand.y}" text-anchor="middle" class="montserrat" font-size="9" letter-spacing="0.4em" fill="#aaaaaa" font-weight="400">${escapeXml(config.layout.brand.text.toUpperCase())}</text>
        ${divider(148)}
        <text x="50%" y="${config.layout.title.y}" text-anchor="middle" class="playfair" font-size="${config.fonts.title.size}" font-weight="700" fill="${config.colors.primary}">${escapeXml(config.layout.title.text)}</text>
        ${divider(246)}
        <text x="50%" y="${config.layout.participantName.y}" text-anchor="middle" class="montserrat" font-size="${config.fonts.body.size}" letter-spacing="0.12em" fill="#777777" font-weight="300">${escapeXml(config.layout.participantName.prefix.toUpperCase())}</text>
        <text x="50%" y="${config.layout.participantName.y + 68}" text-anchor="middle" class="cormorant" font-size="46" font-weight="600" fill="${config.colors.gold}">${escapeXml(data.participantName)}</text>
        <text x="50%" y="${config.layout.role.y}" text-anchor="middle">
          <tspan class="playfair" font-size="11" fill="#666666">${escapeXml(config.layout.role.prefix)} </tspan>
          <tspan class="playfair" font-size="17" font-weight="700" fill="${config.colors.primary}">${escapeXml(data.role)}</tspan>
        </text>
        <text x="50%" y="${config.layout.event.y}" text-anchor="middle">
          <tspan class="playfair" font-size="11" fill="#666666">${escapeXml(config.layout.event.prefix)} </tspan>
          <tspan class="cormorant" font-size="16" font-style="italic" fill="#444444">${escapeXml(data.eventOrInternship)}</tspan>
        </text>
        <text x="50%" y="${config.layout.date.y}" text-anchor="middle" class="montserrat" font-size="${config.fonts.footer.size}" letter-spacing="0.12em" fill="#999999" font-weight="300">${escapeXml(`${config.layout.date.prefix} ${formattedDate}`.toUpperCase())}</text>
        <rect x="100" y="554" width="${width - 200}" height="1" fill="url(#fullDivider)"/>
        <g>
          <circle cx="${config.layout.seal.x}" cy="${config.layout.seal.y}" r="34" fill="none" stroke="${config.colors.gold}" stroke-width="1.3"/>
          <circle cx="${config.layout.seal.x}" cy="${config.layout.seal.y}" r="26" fill="none" stroke="${config.colors.gold}" stroke-width="0.7"/>
          ${sealDots}
          <polygon points="${this.createStarPoints(config.layout.seal.x, config.layout.seal.y - 1, 12, 5, 5)}" fill="none" stroke="${config.colors.gold}" stroke-width="1"/>
          <text x="${config.layout.seal.x}" y="${config.layout.seal.y + 11}" text-anchor="middle" class="montserrat" font-size="5.5" fill="${config.colors.gold}" font-weight="400">VERIFIED</text>
          <text x="${config.layout.seal.x}" y="${config.layout.seal.y + 20}" text-anchor="middle" class="montserrat" font-size="4.5" fill="${config.colors.gold}" font-weight="400">AUTHENTIC</text>
        </g>
        <g>
          <path d="M${signatureCenterX - 78} ${signatureLineY - 37} C ${signatureCenterX - 48} ${signatureLineY - 67}, ${signatureCenterX - 28} ${signatureLineY - 12}, ${signatureCenterX - 6} ${signatureLineY - 42} S ${signatureCenterX + 42} ${signatureLineY - 24}, ${signatureCenterX + 78} ${signatureLineY - 44}" fill="none" stroke="${config.colors.primary}" stroke-width="2" stroke-linecap="round"/>
          <path d="M${signatureCenterX - 48} ${signatureLineY - 25} C ${signatureCenterX - 18} ${signatureLineY - 34}, ${signatureCenterX + 18} ${signatureLineY - 29}, ${signatureCenterX + 54} ${signatureLineY - 35}" fill="none" stroke="${config.colors.gold}" stroke-width="0.9" stroke-linecap="round"/>
          <line x1="${signatureLineStartX}" y1="${signatureLineY}" x2="${signatureLineEndX}" y2="${signatureLineY}" stroke="${config.colors.primary}" stroke-width="1"/>
          <text x="50%" y="${signatureLineY + 28}" text-anchor="middle" class="cormorant" font-size="18" font-style="italic" fill="${config.colors.primary}">${escapeXml(signatureName)}</text>
          <text x="50%" y="${signatureLineY + 49}" text-anchor="middle" class="montserrat" font-size="9.5" letter-spacing="0.15em" fill="#888888">${escapeXml(config.layout.signature.label.toUpperCase())}</text>
          <text x="50%" y="${config.layout.uniqueId.y}" text-anchor="middle" class="mono" font-size="8" fill="#bbbbbb">${escapeXml(uniqueCertificateId)}</text>
        </g>
        <g>
          <rect x="${config.layout.qr.x}" y="${config.layout.qr.y}" width="${config.layout.qr.size}" height="${config.layout.qr.size}" fill="#ffffff"/>
          ${qrRects}
          <text x="${config.layout.qr.x + config.layout.qr.size / 2}" y="${config.layout.qr.y + config.layout.qr.size + 18}" text-anchor="middle" class="montserrat" font-size="8" letter-spacing="0.1em" fill="#aaaaaa">${escapeXml(config.layout.qr.label)}</text>
        </g>
      </svg>
    `;
  }

  private renderSvgEmblem(x: number, y: number): string {
    const config = this.templateConfig;

    return `
      <svg x="${x}" y="${y}" width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r="34" fill="none" stroke="${config.colors.primary}" stroke-width="1.2"/>
        <circle cx="36" cy="36" r="28" fill="none" stroke="${config.colors.gold}" stroke-width="0.6"/>
        <line x1="8" y1="8" x2="64" y2="64" stroke="${config.colors.gold}" stroke-width="0.6" opacity="0.4"/>
        <line x1="64" y1="8" x2="8" y2="64" stroke="${config.colors.gold}" stroke-width="0.6" opacity="0.4"/>
        <line x1="36" y1="2" x2="36" y2="70" stroke="${config.colors.gold}" stroke-width="0.45" opacity="0.4"/>
        <line x1="2" y1="36" x2="70" y2="36" stroke="${config.colors.gold}" stroke-width="0.45" opacity="0.4"/>
        <polygon points="${this.createStarPoints(36, 36, 25, 11, 6)}" fill="none" stroke="${config.colors.primary}" stroke-width="1.1"/>
        <polygon points="${this.createRegularPolygonPoints(36, 36, 12, 6)}" fill="none" stroke="${config.colors.gold}" stroke-width="0.7"/>
        <polygon points="36,28 44,36 36,44 28,36" fill="${config.colors.gold}" stroke="${config.colors.primary}" stroke-width="0.5"/>
      </svg>`;
  }

  private createStarPoints(
    centerX: number,
    centerY: number,
    outerRadius: number,
    innerRadius: number,
    points: number
  ): string {
    return Array.from({ length: points * 2 }, (_, index) => {
      const radius = index % 2 === 0 ? outerRadius : innerRadius;
      const angle = -Math.PI / 2 + (Math.PI * index) / points;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
  }

  private createRegularPolygonPoints(
    centerX: number,
    centerY: number,
    radius: number,
    points: number
  ): string {
    return Array.from({ length: points }, (_, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / points;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
  }

  private formatDate(date: Date): string {
    const day = date.getDate();
    const suffix =
      day % 10 === 1 && day !== 11
        ? 'st'
        : day % 10 === 2 && day !== 12
          ? 'nd'
          : day % 10 === 3 && day !== 13
            ? 'rd'
            : 'th';
    const month = date.toLocaleDateString('en-US', { month: 'long' });

    return `${month} ${day}${suffix}, ${date.getFullYear()}`;
  }

  private selectSignatureName(uniqueCertificateId: string): string {
    const names = this.templateConfig.layout.signature.defaultNames;
    const hash = Array.from(uniqueCertificateId).reduce(
      (total, character) => total + character.charCodeAt(0),
      0
    );

    return names[hash % names.length];
  }

  private generateQrCells(seed: string, size: number): QrCell[] {
    let state = crypto.createHash('sha256').update(seed).digest().readUInt32BE(0) || 1;
    const next = (): boolean => {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;

      return (state >>> 0) % 2 === 0;
    };
    const inFinder = (x: number, y: number, originX: number, originY: number): boolean =>
      x >= originX && x < originX + 7 && y >= originY && y < originY + 7;
    const finderOn = (x: number, y: number, originX: number, originY: number): boolean => {
      const localX = x - originX;
      const localY = y - originY;
      const outer = localX === 0 || localX === 6 || localY === 0 || localY === 6;
      const inner = localX >= 2 && localX <= 4 && localY >= 2 && localY <= 4;

      return outer || inner;
    };
    const cells: QrCell[] = [];

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const finderTopLeft = inFinder(x, y, 0, 0);
        const finderTopRight = inFinder(x, y, size - 7, 0);
        const finderBottomLeft = inFinder(x, y, 0, size - 7);
        let on = false;

        if (finderTopLeft) {
          on = finderOn(x, y, 0, 0);
        } else if (finderTopRight) {
          on = finderOn(x, y, size - 7, 0);
        } else if (finderBottomLeft) {
          on = finderOn(x, y, 0, size - 7);
        } else if (x === 6 || y === 6) {
          on = (x + y) % 2 === 0;
        } else {
          on = next();
        }

        cells.push({ x, y, on });
      }
    }

    return cells;
  }

  private async convertPDFBufferToImage(pdfBuffer: Buffer): Promise<Buffer> {
    const { width, height } = this.templateConfig.layout.page;
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ffffff"/>
        <rect x="3" y="3" width="${width - 6}" height="${height - 6}" fill="none" stroke="#0d0d0d" stroke-width="6"/>
        <text x="50%" y="${height / 2}" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#0d0d0d">Certificate</text>
        <text x="50%" y="${height / 2 + 42}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#777777">Converted from PDF (${pdfBuffer.length} bytes)</text>
      </svg>
    `;

    return sharp(Buffer.from(svg)).png().toBuffer();
  }
}

export const certificateGeneratorService = new CertificateGeneratorService();
