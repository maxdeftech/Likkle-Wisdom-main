import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

/**
 * ReactMarkdown wrapper that converts AI-generated tables into
 * readable bullet-point lists instead of cramped HTML tables.
 */

const markdownComponents: Components = {
  table: ({ children }) => {
    // Collect all row data from the table children
    const rows: string[][] = [];
    let headers: string[] = [];

    React.Children.forEach(children, (section: any) => {
      if (!section?.props?.children) return;
      const sectionType = section.type === 'thead' || section.props?.node?.tagName === 'thead' ? 'head' : 'body';

      React.Children.forEach(section.props.children, (row: any) => {
        if (!row?.props?.children) return;
        const cells: string[] = [];
        React.Children.forEach(row.props.children, (cell: any) => {
          const text = extractText(cell);
          cells.push(text);
        });

        if (sectionType === 'head') {
          headers = cells;
        } else {
          rows.push(cells);
        }
      });
    });

    // Render as bullet points
    if (rows.length === 0 && headers.length > 0) {
      return (
        <ul className="my-3 space-y-2 pl-1">
          {headers.filter(Boolean).map((header, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-1.5 block size-2 shrink-0 rounded-full bg-primary" />
              <span className="font-bold">{header}</span>
            </li>
          ))}
        </ul>
      );
    }

    return (
      <div className="my-3 space-y-3">
        {rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="rounded-xl border border-primary/10 bg-white/50 p-3 dark:border-white/5 dark:bg-white/[0.03]"
          >
            {row.map((cell, cellIdx) => {
              if (!cell.trim()) return null;
              const label = headers[cellIdx];
              return (
                <div key={cellIdx} className="flex items-start gap-2 py-0.5">
                  <span className="mt-1.5 block size-2 shrink-0 rounded-full bg-primary" />
                  <span>
                    {label && <span className="mr-1 text-[10px] font-black uppercase tracking-wider text-primary">{label}:</span>}
                    <span className="font-semibold">{cell}</span>
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  },

  thead: () => null,
  tbody: ({ children }) => <>{children}</>,
  tr: ({ children }) => <>{children}</>,
  th: ({ children }) => <>{children}</>,
  td: ({ children }) => <>{children}</>
};

function extractText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node.props?.children) {
    if (typeof node.props.children === 'string') return node.props.children;
    if (Array.isArray(node.props.children)) return node.props.children.map(extractText).join('');
    return extractText(node.props.children);
  }
  return '';
}

/** Linkify Jamaica phone numbers (119, 110, 1-876-XXX-XXXX) */
const linkifyPhones = (text: string) =>
  text.replace(/(119|110|1-876-\d{3}-\d{4})/g, '[$1](tel:$1)');

/** Check if a line is the Security Tips header */
const isSecurityHeader = (text: string) =>
  /security tips/i.test(text) || /🛡️/.test(text);

interface TravelMarkdownProps {
  children: string;
}

const TravelMarkdown: React.FC<TravelMarkdownProps> = ({ children }) => {
  // Split content at the Security Tips section for distinct styling
  const securityMatch = children.match(/^([\s\S]*?)(#{1,3}\s*🛡️?\s*Security Tips[\s\S]*)$/im);

  if (securityMatch) {
    const mainContent = securityMatch[1];
    const securityContent = linkifyPhones(securityMatch[2]);

    return (
      <>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{mainContent}</ReactMarkdown>
        <div className="mt-6 rounded-2xl border-l-4 border-red-500 bg-red-500/5 dark:bg-red-500/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-red-500">shield</span>
            <span className="text-red-500 font-black text-sm uppercase tracking-widest">Security Tips</span>
          </div>
          <div className="security-tips-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                ...markdownComponents,
                a: ({ href, children: linkChildren }) => (
                  <a href={href} className="text-red-500 font-bold underline">{linkChildren}</a>
                ),
              }}
            >
              {securityContent.replace(/^#{1,3}\s*🛡️?\s*Security Tips\s*/im, '')}
            </ReactMarkdown>
          </div>
        </div>
      </>
    );
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{children}</ReactMarkdown>
  );
};

export default TravelMarkdown;
