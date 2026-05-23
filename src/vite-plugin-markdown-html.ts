import type { Plugin } from 'vite';
import { marked } from 'marked';

export function vitePluginMarkdownHtml(): Plugin {
  const mdSuffix = '.md?html';

  return {
    name: 'vite-plugin-markdown-html',
    enforce: 'pre',

    async transform(code: string, id: string) {
      if (!id.endsWith(mdSuffix)) return;

      // Use marked to convert Markdown to HTML at compile time
      const html = await marked.parse(code, {
        gfm: true,
        breaks: false,
      });

      return {
        code: `export default ${JSON.stringify(html)};`,
        map: null,
      };
    },
  };
}
