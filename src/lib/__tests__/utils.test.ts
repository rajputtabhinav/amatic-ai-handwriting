import { cn, sanitizeSVG, sanitizeCSS } from '../utils';

describe('Utility Functions', () => {
  describe('cn (className merge)', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('should merge tailwind classes correctly', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
    });
  });

  describe('sanitizeSVG', () => {
    it('should remove script tags', () => {
      const input = '<svg><script>alert("xss")</script><rect/></svg>';
      const result = sanitizeSVG(input);
      expect(result).not.toContain('script');
      expect(result).not.toContain('alert');
    });

    it('should remove onclick attributes', () => {
      const input = '<svg><rect onclick="alert(1)"/></svg>';
      const result = sanitizeSVG(input);
      expect(result).not.toContain('onclick');
    });

    it('should remove onload attributes', () => {
      const input = '<svg onload="malicious()"><rect/></svg>';
      const result = sanitizeSVG(input);
      expect(result).not.toContain('onload');
    });

    it('should remove javascript: URLs', () => {
      const input = '<svg><a href="javascript:alert(1)">click</a></svg>';
      const result = sanitizeSVG(input);
      expect(result).not.toContain('javascript:');
    });

    it('should preserve valid SVG content', () => {
      const input = '<svg><rect x="10" y="10" width="100" height="100" fill="red"/></svg>';
      const result = sanitizeSVG(input);
      expect(result).toContain('rect');
      expect(result).toContain('fill="red"');
    });

    it('should remove onerror attributes', () => {
      const input = '<svg><image onerror="alert(1)" href="x"/></svg>';
      const result = sanitizeSVG(input);
      expect(result).not.toContain('onerror');
    });
  });

  describe('sanitizeCSS', () => {
    it('should remove expression() function', () => {
      const input = 'body { width: expression(alert(1)); }';
      const result = sanitizeCSS(input);
      expect(result).not.toContain('expression');
    });

    it('should remove javascript: URLs in url()', () => {
      const input = 'div { background: url(javascript:alert(1)); }';
      const result = sanitizeCSS(input);
      expect(result).not.toContain('javascript:');
    });

    it('should remove behavior property', () => {
      const input = 'div { behavior: url(malicious.htc); }';
      const result = sanitizeCSS(input);
      expect(result).not.toContain('behavior');
    });

    it('should preserve valid CSS', () => {
      const input = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
      const result = sanitizeCSS(input);
      expect(result).toContain('keyframes');
      expect(result).toContain('rotate');
    });

    it('should allow safe url() usages', () => {
      const input = 'div { background: url("image.png"); }';
      const result = sanitizeCSS(input);
      expect(result).toContain('url("image.png")');
    });
  });
});

