import { describe, it, expect } from 'vitest';
import { htmlToPlainText, htmlPreview } from './html-text';

describe('htmlToPlainText (CR-024)', () => {
  it('태그제거_평문반환', () => {
    expect(htmlToPlainText('<p>안녕 <b>굵게</b></p>')).toBe('안녕 굵게');
  });

  it('이미지_표식치환', () => {
    expect(htmlToPlainText('<p>앞</p><img src="x.png"><p>뒤</p>')).toBe('앞 [이미지] 뒤');
  });

  it('블록태그_공백구분', () => {
    expect(htmlToPlainText('<li>하나</li><li>둘</li>')).toBe('하나 둘');
  });

  it('엔티티_복원', () => {
    expect(htmlToPlainText('a &amp; b &lt;c&gt;')).toBe('a & b <c>');
  });

  it('빈값_빈문자열', () => {
    expect(htmlToPlainText('')).toBe('');
    expect(htmlToPlainText(null)).toBe('');
    expect(htmlToPlainText(undefined)).toBe('');
  });
});

describe('htmlPreview (CR-024)', () => {
  it('길이초과_말줄임', () => {
    const long = '<p>' + 'a'.repeat(200) + '</p>';
    const out = htmlPreview(long, 10);
    expect(out).toBe('aaaaaaaaaa…');
  });

  it('짧으면_그대로', () => {
    expect(htmlPreview('<p>짧음</p>', 120)).toBe('짧음');
  });
});
