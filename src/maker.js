// @flow
/* eslint-disable no-magic-numbers */

const DEFAULT_N = 100;

const CONSONANTS = ['b', 'c', 'ch', 'd', 'g', 'j', 'k', 'l', 'm',
  'n', 'p', 'r', 's', 't', 'th', 'v', 'w', 'y', 'z', '', '', '', ''];
const VOWELS = ['a', 'e', 'i', 'o', 'u', 'ai', 'oi', 'ei', 'au', 'ou'];
const MAX_SYLS = 2;

function choice(ar) {
  return ar[Math.floor(ar.length * Math.random())];
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
  return titleCase(out);
}

function name() {
  return `${word(int(1, MAX_SYLS))} ${word(int(1, MAX_SYLS))}`;
}

// // // // // NUMERICAL GENERATORS // // // // //

function clamp(n, min, max) {
  if (n < min) { return min }
  if (n > max) { return max }
  return n;
}

const IH_STEPS = 12;

function int(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normal(mu, sigma, min, max) {
  // note: this is not exactly normal, but a close approximation using the Irwin-Hall distribution
  let acc = 0;

  for (let i = 0; i < IH_STEPS; i++) {
    acc += Math.random();
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
    p *= Math.random();
    k += 1;
  }
  return k - 1;
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

function generate(kind, obj) {
  const spl = kind.split(',');

  switch (spl[0]) {
  case 'name':
    return name();
  case 'word':
    return word(int(1, spl[1]));
  case 'int':
    return int(1, val(spl[1], obj));
  case 'med3':
    return med3(val(spl[1], obj));
  case 'norm':
  case 'normal':
    return normal(val(spl[1], obj), val(spl[2], obj), val(spl[3], obj), val(spl[4], obj));
  case 'poisson':
    return poisson(val(spl[1], obj));
  case 'choice':
    return choice(spl.slice(1).map((v) => val(v, obj)));
  default:
    return '---';
  }
}

const maker = (defs) => {
  const nObjects = defs.n || DEFAULT_N;
  const out = [];

  for (let i = 0; i < nObjects; i++) {
    const obj = {};

    for (const key in defs) {
      if (key !== 'n' && defs.hasOwnProperty(key)) {
        const value = defs[key];

        if (key.match(/.*\*[0-9]+/)) {
          const [keyBase, reps] = key.split('*');

          for (let n = 0; n < reps; n++) {
            obj[`${keyBase}${n}`] = generate(value, obj);
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
