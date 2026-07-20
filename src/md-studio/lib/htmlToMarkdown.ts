export function htmlToMarkdown(html: string): string {
  let md = html;

  md = md.replace(/<tr>([\s\S]*?)<\/tr>/gi, (_, rowHtml: string) => {
    const cells: string[] = [];
    let isHeader = false;
    const cellRegex = /<(td|th)[^>]*>([\s\S]*?)<\/\1>/gi;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      if (cellMatch[1].toLowerCase() === 'th') isHeader = true;
      cells.push(cellMatch[2].replace(/<[^>]+>/g, '').trim());
    }
    if (cells.length === 0) return '';
    const rowStr = '| ' + cells.join(' | ') + ' |';
    if (isHeader) {
      const separator = '| ' + cells.map(() => '---').join(' | ') + ' |';
      return rowStr + '\n' + separator;
    }
    return rowStr;
  });

  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n\n');
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n\n');
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n\n');
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n\n');

  md = md.replace(/<li>([\s\S]*?)<\/li>/gi, '$1\n');
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, listHtml: string) =>
    '\n' + listHtml.split('\n').filter(Boolean).map((l) => `- ${l}`).join('\n') + '\n\n'
  );
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, listHtml: string) => {
    const items = listHtml.split('\n').filter(Boolean);
    return '\n' + items.map((item, i) => `${i + 1}. ${item}`).join('\n') + '\n\n';
  });

  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');
  md = md.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*');

  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, content: string) =>
    content.trim().split('\n').map((l) => `> ${l}`).join('\n') + '\n\n'
  );
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<hr[^>]*>/gi, '\n---\n');
  md = md.replace(/<code>([\s\S]*?)<\/code>/gi, '`$1`');
  md = md.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '\n```\n$1\n```\n');

  md = md.replace(/<[^>]+>/g, '');

  // Decode HTML entities via the browser's textarea trick.
  if (typeof document !== 'undefined') {
    const txt = document.createElement('textarea');
    txt.innerHTML = md;
    md = txt.value;
  }

  md = md.replace(/\n{3,}/g, '\n\n');
  return md.trim();
}
