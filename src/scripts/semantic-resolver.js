const INTERACTIVE_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const LANDMARK_SELECTOR = [
  'header',
  'nav',
  'main',
  'aside',
  'footer',
  'section[aria-label]',
  'section[aria-labelledby]',
  '[role="banner"]',
  '[role="navigation"]',
  '[role="main"]',
  '[role="complementary"]',
  '[role="contentinfo"]',
].join(',');

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function isVisible(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return (
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    style.opacity !== '0' &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function escapeSelectorPart(value) {
  if (window.CSS?.escape) return CSS.escape(value);
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

export function getCssSelector(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return null;
  if (element.id) return `#${escapeSelectorPart(element.id)}`;

  const parts = [];
  let current = element;
  for (let depth = 0; current && current.nodeType === Node.ELEMENT_NODE && depth < 4; depth += 1) {
    let selector = current.tagName.toLowerCase();
    const name = current.getAttribute('name');
    if (name) selector += `[name="${escapeSelectorPart(name)}"]`;
    const role = current.getAttribute('role');
    if (role) selector += `[role="${escapeSelectorPart(role)}"]`;
    const className = String(current.className ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((cls) => `.${escapeSelectorPart(cls)}`)
      .join('');
    selector += className;

    const siblings = Array.from(current.parentElement?.children ?? []).filter(
      (node) => node.tagName === current.tagName,
    );
    if (siblings.length > 1) {
      selector += `:nth-of-type(${siblings.indexOf(current) + 1})`;
    }

    parts.unshift(selector);
    if (current.parentElement?.id) {
      parts.unshift(`#${escapeSelectorPart(current.parentElement.id)}`);
      break;
    }
    current = current.parentElement;
  }

  return parts.join(' > ');
}

function getTextFromNode(node) {
  return cleanText(node?.textContent || '');
}

export function getLabelText(element) {
  if (!element) return '';

  const id = element.id;
  if (id) {
    const escapedId = window.CSS?.escape ? CSS.escape(id) : id.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
    const label = document.querySelector(`label[for="${escapedId}"]`);
    const labelText = cleanText(label?.textContent);
    if (labelText) return labelText;
  }

  const enclosingLabel = element.closest('label');
  const enclosingText = cleanText(enclosingLabel?.textContent);
  if (enclosingText) return enclosingText;

  const ariaLabel = cleanText(element.getAttribute('aria-label'));
  if (ariaLabel) return ariaLabel;

  const ariaLabelledBy = cleanText(element.getAttribute('aria-labelledby'));
  if (ariaLabelledBy) {
    const texts = ariaLabelledBy
      .split(/\s+/)
      .map((ref) => document.getElementById(ref))
      .map(getTextFromNode)
      .filter(Boolean);
    if (texts.length) return texts.join(' ');
  }

  const placeholder = cleanText(element.getAttribute('placeholder'));
  if (placeholder) return placeholder;

  const title = cleanText(element.getAttribute('title'));
  if (title) return title;

  return cleanText(element.textContent);
}

export function getAccessibleName(element) {
  if (!element) return '';

  const ariaLabel = cleanText(element.getAttribute('aria-label'));
  if (ariaLabel) return ariaLabel;

  const ariaLabelledBy = cleanText(element.getAttribute('aria-labelledby'));
  if (ariaLabelledBy) {
    const texts = ariaLabelledBy
      .split(/\s+/)
      .map((ref) => document.getElementById(ref))
      .map(getTextFromNode)
      .filter(Boolean);
    if (texts.length) return texts.join(' ');
  }

  const labelText = getLabelText(element);
  if (labelText) return labelText;

  const alt = cleanText(element.getAttribute('alt'));
  if (alt) return alt;

  const title = cleanText(element.getAttribute('title'));
  if (title) return title;

  return cleanText(element.textContent);
}

export function getSectionTitle(element) {
  if (!element) return '';

  const fieldset = element.closest('fieldset');
  if (fieldset) {
    const legendText = cleanText(fieldset.querySelector('legend')?.textContent);
    if (legendText) return legendText;
  }

  let current = element.parentElement;
  while (current) {
    const heading = current.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6');
    const headingText = cleanText(heading?.textContent);
    if (headingText) return headingText;
    current = current.parentElement;
  }

  return '';
}

function getFormId(element) {
  return element?.closest('form')?.id || null;
}

function getGroupContainerSelector(element) {
  const container = element.closest('form, fieldset, [role="group"], [aria-labelledby]');
  return container ? getCssSelector(container) : null;
}

function getBoundingBox(element) {
  const rect = element.getBoundingClientRect();
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

function getOrderIndex(element, interactiveElements) {
  return interactiveElements.indexOf(element);
}

function summarizeInteractiveElement(element, interactiveElements) {
  const tagName = element.tagName.toLowerCase();
  const type = cleanText(element.getAttribute('type'));
  const role = cleanText(element.getAttribute('role'));
  const name = cleanText(element.getAttribute('name'));
  const placeholder = cleanText(element.getAttribute('placeholder'));
  const ariaLabel = cleanText(element.getAttribute('aria-label'));
  const ariaDescription = cleanText(element.getAttribute('aria-describedby'));
  const checked = 'checked' in element ? Boolean(element.checked) : undefined;
  const required = element.required ?? element.getAttribute('aria-required') === 'true';
  const disabled = Boolean(element.disabled);
  const selector = getCssSelector(element);

  return {
    tagName,
    role: role || null,
    accessibleName: getAccessibleName(element) || null,
    labelText: getLabelText(element) || null,
    inputType: type || null,
    name: name || null,
    placeholder: placeholder || null,
    aria: {
      label: ariaLabel || null,
      labelledBy: cleanText(element.getAttribute('aria-labelledby')) || null,
      describedBy: ariaDescription || null,
      live: cleanText(element.getAttribute('aria-live')) || null,
    },
    required: Boolean(required),
    disabled,
    checked,
    visible: isVisible(element),
    boundingBox: getBoundingBox(element),
    container: getGroupContainerSelector(element),
    visualOrder: getOrderIndex(element, interactiveElements),
    css_selector: selector,
    formId: getFormId(element),
    sectionTitle: getSectionTitle(element) || null,
  };
}

export function collectPageSemantics(root = document) {
  const interactiveElements = Array.from(root.querySelectorAll(INTERACTIVE_SELECTOR)).filter(
    (element) => isVisible(element),
  );
  const landmarks = Array.from(root.querySelectorAll(LANDMARK_SELECTOR))
    .filter((element) => isVisible(element))
    .slice(0, 50)
    .map((element) => ({
      tagName: element.tagName.toLowerCase(),
      role: cleanText(element.getAttribute('role')) || null,
      accessibleName: getAccessibleName(element) || null,
      labelText: getLabelText(element) || null,
      css_selector: getCssSelector(element),
      boundingBox: getBoundingBox(element),
    }));

  const formGroups = Array.from(root.querySelectorAll('form, fieldset'))
    .filter((element) => isVisible(element))
    .slice(0, 25)
    .map((element) => ({
      tagName: element.tagName.toLowerCase(),
      css_selector: getCssSelector(element),
      formId: element.tagName.toLowerCase() === 'form' ? element.id || null : element.closest('form')?.id || null,
      sectionTitle: getSectionTitle(element) || null,
      boundingBox: getBoundingBox(element),
      interactiveCount: element.querySelectorAll?.(INTERACTIVE_SELECTOR)?.length ?? 0,
    }));

  return {
    landmarks,
    interactive_elements: interactiveElements.slice(0, 200).map((element) => summarizeInteractiveElement(element, interactiveElements)),
    form_groups: formGroups,
  };
}

export function describeTargetElement(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return {
      css_selector: null,
      tagName: null,
      inputType: null,
      name: null,
      labelText: null,
      formId: null,
      sectionTitle: null,
      role: null,
      accessibleName: null,
      placeholder: null,
      required: null,
      disabled: null,
      checked: null,
      visible: null,
    };
  }

  const tagName = element.tagName.toUpperCase();
  const inputType = cleanText(element.getAttribute('type')) || null;
  const name = cleanText(element.getAttribute('name')) || null;
  const labelText = getLabelText(element) || null;
  const accessibleName = getAccessibleName(element) || null;
  const formId = element.closest('form')?.id || null;
  const sectionTitle = getSectionTitle(element) || null;
  const role = cleanText(element.getAttribute('role')) || null;
  const placeholder = cleanText(element.getAttribute('placeholder')) || null;
  const required = element.required ?? element.getAttribute('aria-required') === 'true';
  const disabled = Boolean(element.disabled);
  const checked = 'checked' in element ? Boolean(element.checked) : null;

  return {
    css_selector: getCssSelector(element),
    tagName,
    inputType,
    name,
    labelText,
    formId,
    sectionTitle,
    role,
    accessibleName,
    placeholder,
    required: Boolean(required),
    disabled,
    checked,
    visible: isVisible(element),
  };
}

export function isLikelyModal(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
  const role = cleanText(element.getAttribute('role'));
  const ariaModal = cleanText(element.getAttribute('aria-modal'));
  const className = cleanText(element.className);
  return role === 'dialog' || role === 'alertdialog' || ariaModal === 'true' || /modal|dialog/i.test(className);
}

export function isLikelyToast(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
  const role = cleanText(element.getAttribute('role'));
  const className = cleanText(element.className);
  return role === 'status' || role === 'alert' || /toast|snackbar/i.test(className);
}

export function isLikelyInlineError(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
  const className = cleanText(element.className);
  const role = cleanText(element.getAttribute('role'));
  return role === 'alert' || /error|invalid|help-block|field-error/i.test(className);
}

export function isInteractiveElement(element) {
  return Boolean(element?.matches?.(INTERACTIVE_SELECTOR));
}

export function getFirstRelevantHeading(container) {
  return cleanText(container?.querySelector?.('h1, h2, h3, h4, h5, h6')?.textContent || '');
}
