// @flow

import {choice, int, ALPHA_UPPER, ALPHA_LOWER} from '.';

const GREEK = [
  'alpha',
  'beta',
  'gamma', 'Gamma',
  'delta', 'Delta',
  'epsilon', 'varepsilon',
  'zeta',
  'eta',
  'theta', 'Theta', 'vartheta',
  'iota',
  'kappa', 'varkappa',
  'lambda', 'Lambda',
  'mu',
  'nu',
  'xi', 'Xi',
  'pi', 'Pi', 'varpi',
  'rho', 'varrho',
  'sigma', 'Sigma', 'varsigma',
  'tau',
  'upsilon', 'Upsilon',
  'phi', 'Phi', 'varphi',
  'chi',
  'psi', 'Psi',
  'omega', 'Omega'
].map((st) => `\\${st}`);

const REL = [
  '<', '>', '=',
  '\\leq', '\\req', '\\neq',
  '\\prec', '\\succ',
  '\\ll', '\\gg', '\\approx', '\\equiv'
];

const BINOP = [
  '+', '-', '\\pm', '\\times', '\\mp', '\\div', '\\ast', '\\star',
  '\\cap', '\\cup', '\\sqcap', '\\sqcup', '\\vee', '\\wedge',
  '\\oplus', '\\ominus', '\\otimes', '\\oslash', '\\odot'
];

const ACCENTS = [
  'hat', 'breve', 'grave', 'bar', 'check', 'acute', 'tilde', 'vec', 'dot', 'ddot', 'mathring'
].map((st) => `\\${st}`);

/* eslint-disable no-magic-numbers, complexity */
function randomExpr() {
  switch (int(1, 25)) {
  case 1:
  case 13:
  case 14:
    return choice(GREEK);
  case 2:
  case 15:
  case 16:
    return choice(ALPHA_LOWER);
  case 3:
  case 17:
  case 18:
    return choice(ALPHA_UPPER);
  case 22:
  case 20:
  case 21:
    return `${int(-2, 10)}`;
  case 4:
    return '{{~}^{~}}';
  case 5:
    return '{{~}_{~}}';
  case 6:
    return `{~}${choice(BINOP)}{~}`;
  case 7:
    return `${choice(ACCENTS)}{~}`;
  case 8:
    return '\\frac{~}{~}';
  case 9:
    return '\\int_{~}^{~}~';
  case 10:
    return `\\mathbb{${choice(ALPHA_UPPER)}}`;
  case 11:
    return '\\sum_{~}^{~}~';
  case 19:
    return '\\prod_{~}^{~}~';
  case 12:
    return '~~';
  default:
    return '~';
  }
}

function generate() {
  let expr = `{~}${choice(REL)}{~}`;

  while (expr.includes('~')) {
    console.log(expr);
    expr = expr.replace(/(~)/g, () => randomExpr());
  }

  return expr;
}

// eslint-disable-next-line no-console
console.log(generate());
