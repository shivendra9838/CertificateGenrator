import { certificateTemplateConfig, CertificateTemplateConfig } from './certificateTemplate';

describe('Certificate Template Configuration', () => {
  describe('Structure Validation', () => {
    it('should have all required top-level properties', () => {
      expect(certificateTemplateConfig).toHaveProperty('pageSize');
      expect(certificateTemplateConfig).toHaveProperty('orientation');
      expect(certificateTemplateConfig).toHaveProperty('margins');
      expect(certificateTemplateConfig).toHaveProperty('fonts');
      expect(certificateTemplateConfig).toHaveProperty('colors');
      expect(certificateTemplateConfig).toHaveProperty('layout');
    });

    it('should have valid page configuration', () => {
      expect(certificateTemplateConfig.pageSize).toEqual([1050, 742]);
      expect(certificateTemplateConfig.orientation).toBe('landscape');
    });

    it('should have all margin properties', () => {
      const { margins } = certificateTemplateConfig;
      expect(margins).toHaveProperty('top');
      expect(margins).toHaveProperty('bottom');
      expect(margins).toHaveProperty('left');
      expect(margins).toHaveProperty('right');
    });

    it('should have non-negative margin values', () => {
      const { margins } = certificateTemplateConfig;
      expect(margins.top).toBeGreaterThanOrEqual(0);
      expect(margins.bottom).toBeGreaterThanOrEqual(0);
      expect(margins.left).toBeGreaterThanOrEqual(0);
      expect(margins.right).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Font Configuration', () => {
    it('should have all font types defined', () => {
      const { fonts } = certificateTemplateConfig;
      expect(fonts).toHaveProperty('brand');
      expect(fonts).toHaveProperty('title');
      expect(fonts).toHaveProperty('body');
      expect(fonts).toHaveProperty('footer');
    });

    it('should have family and size for each font type', () => {
      const { fonts } = certificateTemplateConfig;

      expect(fonts.brand).toHaveProperty('family');
      expect(fonts.brand).toHaveProperty('size');
      expect(fonts.title).toHaveProperty('family');
      expect(fonts.title).toHaveProperty('size');
      expect(fonts.body).toHaveProperty('family');
      expect(fonts.body).toHaveProperty('size');
      expect(fonts.footer).toHaveProperty('family');
      expect(fonts.footer).toHaveProperty('size');
    });

    it('should have non-empty font families', () => {
      const { fonts } = certificateTemplateConfig;
      expect(fonts.brand.family).toBeTruthy();
      expect(fonts.title.family).toBeTruthy();
      expect(fonts.body.family).toBeTruthy();
      expect(fonts.footer.family).toBeTruthy();
    });

    it('should have positive font sizes', () => {
      const { fonts } = certificateTemplateConfig;
      expect(fonts.brand.size).toBeGreaterThan(0);
      expect(fonts.title.size).toBeGreaterThan(0);
      expect(fonts.body.size).toBeGreaterThan(0);
      expect(fonts.footer.size).toBeGreaterThan(0);
    });

    it('should have title font larger than body font', () => {
      const { fonts } = certificateTemplateConfig;
      expect(fonts.title.size).toBeGreaterThan(fonts.body.size);
    });

    it('should have body font larger than or equal to footer font', () => {
      const { fonts } = certificateTemplateConfig;
      expect(fonts.body.size).toBeGreaterThanOrEqual(fonts.footer.size);
    });
  });

  describe('Color Configuration', () => {
    it('should have all color properties', () => {
      const { colors } = certificateTemplateConfig;
      expect(colors).toHaveProperty('primary');
      expect(colors).toHaveProperty('secondary');
      expect(colors).toHaveProperty('gold');
      expect(colors).toHaveProperty('mutedGold');
      expect(colors).toHaveProperty('text');
      expect(colors).toHaveProperty('mutedText');
    });

    it('should have valid hex color format', () => {
      const { colors } = certificateTemplateConfig;
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

      expect(colors.primary).toMatch(hexColorRegex);
      expect(colors.secondary).toMatch(hexColorRegex);
      expect(colors.gold).toMatch(hexColorRegex);
      expect(colors.mutedGold).toMatch(hexColorRegex);
      expect(colors.text).toMatch(hexColorRegex);
      expect(colors.mutedText).toMatch(hexColorRegex);
    });
  });

  describe('Layout Configuration', () => {
    it('should have all layout elements', () => {
      const { layout } = certificateTemplateConfig;
      expect(layout).toHaveProperty('page');
      expect(layout).toHaveProperty('brand');
      expect(layout).toHaveProperty('title');
      expect(layout).toHaveProperty('participantName');
      expect(layout).toHaveProperty('role');
      expect(layout).toHaveProperty('event');
      expect(layout).toHaveProperty('date');
      expect(layout).toHaveProperty('signature');
      expect(layout).toHaveProperty('qr');
      expect(layout).toHaveProperty('seal');
      expect(layout).toHaveProperty('uniqueId');
    });

    it('should have brand text, tagline, and y position', () => {
      const { layout } = certificateTemplateConfig;
      expect(layout.brand).toHaveProperty('text');
      expect(layout.brand).toHaveProperty('tagline');
      expect(layout.brand).toHaveProperty('y');
      expect(layout.brand.text).toBeTruthy();
      expect(layout.brand.text).toBe('Proudly Presents');
      expect(layout.brand.y).toBeGreaterThanOrEqual(0);
    });

    it('should have the print page size configured', () => {
      expect(certificateTemplateConfig.layout.page).toEqual({
        width: 1050,
        height: 742,
      });
    });

    it('should have text and y position for title', () => {
      const { layout } = certificateTemplateConfig;
      expect(layout.title).toHaveProperty('text');
      expect(layout.title).toHaveProperty('y');
      expect(layout.title.text).toBeTruthy();
      expect(layout.title.y).toBeGreaterThanOrEqual(0);
    });

    it('should have prefix and y position for all other elements', () => {
      const { layout } = certificateTemplateConfig;
      const elements = ['participantName', 'role', 'event', 'date', 'uniqueId'] as const;

      elements.forEach((element) => {
        expect(layout[element]).toHaveProperty('prefix');
        expect(layout[element]).toHaveProperty('y');
        expect(layout[element].prefix).toBeTruthy();
        expect(layout[element].y).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have label, y position, and line width for signature', () => {
      const { layout } = certificateTemplateConfig;

      expect(layout.signature).toHaveProperty('label');
      expect(layout.signature).toHaveProperty('y');
      expect(layout.signature).toHaveProperty('lineWidth');
      expect(layout.signature).toHaveProperty('defaultNames');
      expect(layout.signature.label).toBeTruthy();
      expect(layout.signature.y).toBeGreaterThanOrEqual(0);
      expect(layout.signature.lineWidth).toBeGreaterThan(0);
      expect(layout.signature.defaultNames.length).toBeGreaterThan(0);
    });

    it('should use Head HR as the default signature label', () => {
      expect(certificateTemplateConfig.layout.signature.label).toBe('Head HR');
    });

    it('should have QR and seal placement configured', () => {
      const { layout } = certificateTemplateConfig;

      expect(layout.qr.label).toBeTruthy();
      expect(layout.qr.x).toBeGreaterThanOrEqual(0);
      expect(layout.qr.y).toBeGreaterThanOrEqual(0);
      expect(layout.qr.size).toBeGreaterThan(0);
      expect(layout.seal.text).toBeTruthy();
      expect(layout.seal.x).toBeGreaterThanOrEqual(0);
      expect(layout.seal.y).toBeGreaterThanOrEqual(0);
      expect(layout.seal.radius).toBeGreaterThan(0);
    });

    it('should have elements positioned in logical order from top to bottom', () => {
      const { layout } = certificateTemplateConfig;

      expect(layout.brand.y).toBeLessThan(layout.title.y);

      expect(layout.title.y).toBeLessThan(layout.participantName.y);

      expect(layout.participantName.y).toBeLessThan(layout.role.y);

      expect(layout.role.y).toBeLessThan(layout.event.y);

      expect(layout.event.y).toBeLessThan(layout.date.y);

      expect(layout.date.y).toBeLessThan(layout.signature.y);

      expect(layout.signature.y).toBeLessThan(layout.uniqueId.y);

      expect(layout.date.y).toBeLessThan(layout.uniqueId.y);
    });

    it('should have sufficient spacing between elements', () => {
      const { layout } = certificateTemplateConfig;
      const minSpacing = 40;

      expect(layout.participantName.y - layout.title.y).toBeGreaterThanOrEqual(minSpacing);
      expect(layout.role.y - layout.participantName.y).toBeGreaterThanOrEqual(minSpacing);
      expect(layout.event.y - layout.role.y).toBeGreaterThanOrEqual(minSpacing);
      expect(layout.date.y - layout.event.y).toBeGreaterThanOrEqual(minSpacing);
      expect(layout.signature.y - layout.date.y).toBeGreaterThanOrEqual(minSpacing);
      expect(layout.uniqueId.y - layout.date.y).toBeGreaterThanOrEqual(minSpacing);
    });
  });

  describe('Page Boundary Validation', () => {
    it('should have all elements within A4 landscape page height', () => {
      const { layout, margins } = certificateTemplateConfig;
      const maxY = certificateTemplateConfig.layout.page.height - margins.bottom;

      expect(layout.title.y).toBeLessThan(maxY);
      expect(layout.brand.y).toBeLessThan(maxY);
      expect(layout.participantName.y).toBeLessThan(maxY);
      expect(layout.role.y).toBeLessThan(maxY);
      expect(layout.event.y).toBeLessThan(maxY);
      expect(layout.date.y).toBeLessThan(maxY);
      expect(layout.signature.y).toBeLessThan(maxY);
      expect(layout.uniqueId.y).toBeLessThan(maxY);
      expect(layout.qr.y + layout.qr.size).toBeLessThan(maxY);
      expect(layout.seal.y + layout.seal.radius).toBeLessThan(maxY);
    });

    it('should have all elements below top margin', () => {
      const { layout, margins } = certificateTemplateConfig;

      expect(layout.brand.y).toBeGreaterThanOrEqual(margins.top);
      expect(layout.title.y).toBeGreaterThanOrEqual(margins.top);
      expect(layout.participantName.y).toBeGreaterThanOrEqual(margins.top);
      expect(layout.role.y).toBeGreaterThanOrEqual(margins.top);
      expect(layout.event.y).toBeGreaterThanOrEqual(margins.top);
      expect(layout.date.y).toBeGreaterThanOrEqual(margins.top);
      expect(layout.signature.y).toBeGreaterThanOrEqual(margins.top);
      expect(layout.uniqueId.y).toBeGreaterThanOrEqual(margins.top);
    });
  });

  describe('Type Safety', () => {
    it('should match CertificateTemplateConfig interface', () => {
      const config: CertificateTemplateConfig = certificateTemplateConfig;
      expect(config).toBeDefined();
    });

    it('should have correct orientation type', () => {
      const validOrientations: Array<'portrait' | 'landscape'> = ['portrait', 'landscape'];
      expect(validOrientations).toContain(certificateTemplateConfig.orientation);
    });
  });
});
