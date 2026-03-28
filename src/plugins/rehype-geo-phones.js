/**
 * Rehype plugin that wraps inline phone number pairs in markdown content
 * with geo-personalization spans.
 *
 * Expects the standard format:
 *   [860-573-8760](tel:860-573-8760) (CT) | [617-668-1677](tel:617-668-1677) (MA)
 *
 * Produces three versions inside the parent <p>/<li>:
 *   <span class="geo-phone-both">...original...</span>
 *   <span class="geo-phone-ct">..CT number only..</span>
 *   <span class="geo-phone-ma">..MA number only..</span>
 *
 * CSS in global.css handles visibility based on the geo class on <html>.
 */
import { visit } from 'unist-util-visit';

const CT_DIGITS = '8605738760';
const MA_DIGITS = '6176681677';

function isPhoneLink(node, digits) {
  if (node.type !== 'element' || node.tagName !== 'a') return false;
  const href = node.properties?.href || '';
  return href.replace(/\D/g, '').includes(digits);
}

function deepClone(node) {
  return JSON.parse(JSON.stringify(node));
}

function hasBothPhones(children) {
  let hasCT = false, hasMA = false;
  for (const child of children) {
    if (isPhoneLink(child, CT_DIGITS)) hasCT = true;
    if (isPhoneLink(child, MA_DIGITS)) hasMA = true;
    if (hasCT && hasMA) return true;
  }
  return false;
}

/**
 * Build a single-state version by removing the other state's phone link
 * and its surrounding label text: " (XX) | " or " | ... (XX)"
 */
function buildVersion(children, removeDigits) {
  const result = [];
  for (let i = 0; i < children.length; i++) {
    const node = children[i];

    if (isPhoneLink(node, removeDigits)) {
      // Remove trailing " (CT)" or " (MA)" from next text node
      if (i + 1 < children.length && children[i + 1].type === 'text') {
        children[i + 1].value = children[i + 1].value
          .replace(/^\s*\((?:CT|MA)\)\s*/i, '')
          .replace(/^\s*\|\s*/, '');
      }
      // Remove preceding " | " or leading separator from last result text
      if (result.length > 0 && result[result.length - 1].type === 'text') {
        result[result.length - 1].value = result[result.length - 1].value
          .replace(/\s*\|\s*$/, '')
          .replace(/\s+$/, ' ');
      }
      continue;
    }

    result.push(node);
  }

  // Trim trailing whitespace from last text node
  if (result.length > 0 && result[result.length - 1].type === 'text') {
    result[result.length - 1].value = result[result.length - 1].value.replace(/\s+$/, '');
  }

  return result;
}

export default function rehypeGeoPhones() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'p' && node.tagName !== 'li') return;
      if (!node.children || !hasBothPhones(node.children)) return;

      const ctVersion = buildVersion(deepClone(node.children), MA_DIGITS);
      const maVersion = buildVersion(deepClone(node.children), CT_DIGITS);

      node.children = [
        {
          type: 'element', tagName: 'span',
          properties: { className: ['geo-phone-both'], style: '--geo-display: inline' },
          children: node.children,
        },
        {
          type: 'element', tagName: 'span',
          properties: { className: ['geo-phone-ct'], style: '--geo-display: inline' },
          children: ctVersion,
        },
        {
          type: 'element', tagName: 'span',
          properties: { className: ['geo-phone-ma'], style: '--geo-display: inline' },
          children: maVersion,
        },
      ];
    });
  };
}
