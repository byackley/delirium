// @flow
/* eslint-disable no-magic-numbers */

import crypto from 'crypto';

const DEFAULT_N = 100;

const CONSONANTS = ['b', 'c', 'ch', 'd', 'g', 'j', 'k', 'l', 'm',
  'n', 'p', 'r', 's', 't', 'th', 'v', 'w', 'y', 'z', '', '', '', ''];
const VOWELS = ['a', 'e', 'i', 'o', 'u', 'ai', 'oi', 'ei', 'au', 'ou'];
const MAX_SYLS = 2;

function rand() {
  const base = crypto.randomBytes(32).readUInt32BE(0);

  return base / (2 ** 32);
}

function choice(ar) {
  return ar[Math.floor(ar.length * rand())];
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const HEX = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

function string(source, len) {
  const array = [];

  for (let i = 0; i < len; i++) {
    array.push(choice(source));
  }
  return array.join('');
}

function syllable() {
  return `${choice(CONSONANTS)}${choice(VOWELS)}${choice(CONSONANTS)}`;
}

function titleCase(w) {
  return `${w.charAt(0).toUpperCase()}${w.slice(1)}`;
}

function word(syls) {
  let out = '';

  for (let i = 0; i < syls; i++) {
    out += syllable();
  }
  return out;
}

function sentence() {
  const words = poisson(4) + 1;

  let out = '';

  for (let i = 0; i < words; i++) {
    out += word(poisson(1) + 1);
    out += ' ';
  }
  out = `${out.charAt(0).toUpperCase() + out.slice(1, out.length - 1)}.`;
  return out;
}

function name() {
  return `${titleCase(word(int(1, MAX_SYLS)))} ${titleCase(word(int(1, MAX_SYLS)))}`;
}

// // // // // NUMERICAL GENERATORS // // // // //

function clamp(n, min, max) {
  if (n < min) { return min }
  if (n > max) { return max }
  return n;
}

const IH_STEPS = 12;

function int(min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function normal(mu, sigma, min, max) {
  // note: this is not exactly normal, but a close approximation using the Irwin-Hall distribution
  let acc = 0;

  for (let i = 0; i < IH_STEPS; i++) {
    acc += rand();
  }

  const result = mu + (sigma * (acc - (IH_STEPS / 2)));

  return clamp(result, min, max);
}

function med3(max) {
  let a = int(1, max);
  let b = int(1, max);
  let c = int(1, max);

  if (a > b) { [a, b] = [b, a] }
  if (b > c) { [b, c] = [c, b] }
  if (a > b) { [a, b] = [b, a] }

  return b;
}

function poisson(lambda) {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;

  while (p > L) {
    p *= rand();
    k += 1;
  }
  return k;
}

function latlong() {
  // these values should end up uniformly distributed over the sphere
  const theta = (rand() * 360) - 180;
  const pi = (360 / Math.PI * Math.asin(Math.sqrt(rand()))) - 90;

  return [pi, theta];
}

// // // // // OBJECT GENERATOR // // // // //

class VariableError extends Error {}

function val(arg, obj) {
  if (arg.charAt(0) === '*') {
    if (obj.hasOwnProperty(arg.slice(1))) { return obj[arg.slice(1)] }

    throw new VariableError(arg.slice(1));
  } else if (arg.match(/[0-9]+/)) {
    return parseInt(arg);
  } else if (arg.match(/[0-9.]+/)) {
    return parseFloat(arg);
  }
  return arg;
}

/* eslint-disable complexity */
// this function is just one big switch statement, so of course it's going to have a bunch of paths
function generate(kind, obj) {
  const spl = kind.split(',');

  switch (spl[0]) {
  case 'name':
    return name();
  case 'word':
    return word(int(1, spl[1]));
  case 'int':
    return int(val(spl[1], obj), val(spl[2], obj));
  case 'med3':
    return med3(val(spl[1], obj));
  case 'norm':
  case 'normal':
    return normal(val(spl[1], obj), val(spl[2], obj), val(spl[3], obj), val(spl[4], obj));
  case 'poisson':
    return poisson(val(spl[1], obj));
  case 'choice':
    return choice(spl.slice(1).map((v) => val(v, obj)));
  case 'latlong':
    return latlong();
  case 'digits':
    return string(DIGITS, val(spl[1], obj));
  case 'hex':
    return string(HEX, val(spl[1], obj));
  case 'string':
    return string(val(spl[1], obj).split(''), val(spl[2], obj));
  case 'phone':
    return `${string(DIGITS, 3)}-${string(DIGITS, 3)}-${string(DIGITS, 4)}`;
  case 'sentence':
    return sentence();
  default:
    return spl[0];
  }
}
/* eslint-enable complexity */

const maker = (defs) => {
  const nObjects = defs.n || DEFAULT_N;
  const out = [];

  for (let i = 0; i < nObjects; i++) {
    const obj = {};

    for (const key in defs) {
      if (key !== 'n' && defs.hasOwnProperty(key)) {
        if (obj.hasOwnProperty(key)) { continue }

        const value = defs[key];

        if (typeof value !== 'string') {
          continue;
        }

        if (key.match(/.*\*[0-9]+/)) {
          const [keyBase, reps] = key.split('*');

          obj[keyBase] = [];

          for (let n = 0; n < reps; n++) {
            obj[keyBase][n] = generate(value, obj);
          }
        } else {
          obj[key] = generate(value, obj);
        }
      }
    }
    obj.id = i;
    out.push(obj);
  }
  return out;
};

export default maker;
