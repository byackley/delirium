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

export const generators = {
  name,
  word,
  int,
  med3,
  normal,
  poisson,
  choice,
  latlong,
  digits: (n, obj) => string(DIGITS, val(n, obj)),
  hex:    (n, obj) => string(HEX, val(n, obj)),
  string,
  phone:  () => `${string(DIGITS, 3)}-${string(DIGITS, 3)}-${string(DIGITS, 4)}`,
  sentence
};
generators.name.doc = 'Generates a full name (first and last)';
generators.word.doc = 'Generates one lowercased word';
generators.word.args = ['syllables'];
generators.int.doc = 'Generates an integer between [min] and [max]';
generators.int.args = ['min', 'max'];
generators.med3.doc = 'Generates the median of three random numbers between 1 and [max]';
generators.med3.args = ['max'];
generators.normal.doc = '(norm) Generates a number using a normal distribution';
generators.normal.args = ['mu', 'sigma', 'min', 'max'];
generators.poisson.doc = 'Generates a number using a Poisson distribution';
generators.poisson.args = ['lambda'];
generators.choice.doc = 'Chooses randomly between given options';
generators.choice.args = ['...options'];
generators.latlong.doc = 'Generates a lat / long pair';
generators.digits.doc = 'Generates a string of decimal digits';
generators.digits.args = ['length'];
generators.hex.doc = 'Generates a string of hexadecimal digits';
generators.hex.args = ['length'];
generators.string.doc = 'Generates a string using the given alphabet';
generators.string.args = ['alphabet', 'length'];
generators.phone.doc = 'Generates a formatted 10-digit phone number';
generators.sentence.doc = 'Generates a sentence of gibberish';


/* eslint-disable no-unused-vars */
// These methods should have a consistent signature, whether or not they use all
// available data.
export const parsers = {
  name:     (spl, obj) => name(),
  word:     (spl, obj) => word(int(1, spl[1])),
  'int':    (spl, obj) => int(val(spl[1], obj), val(spl[2], obj)),
  med3:     (spl, obj) => med3(val(spl[1], obj)),
  norm:     (spl, obj) => normal(
                            val(spl[1], obj), val(spl[2], obj),
                            val(spl[3], obj), val(spl[4], obj)),
  normal:   (spl, obj) => normal(
                            val(spl[1], obj), val(spl[2], obj),
                            val(spl[3], obj), val(spl[4], obj)),
  poisson:  (spl, obj) => poisson(val(spl[1], obj)),
  choice:   (spl, obj) => choice(spl.slice(1).map((v) => val(v, obj))),
  latlong:  (spl, obj) => latlong(),
  digits:   (spl, obj) => generators.digits(spl[1], obj),
  hex:      (spl, obj) => generators.hex(spl[1], obj),
  string:   (spl, obj) => string(spl[1].split(''), val(spl[2], obj)),
  phone:    (spl, obj) => generators.phone(),
  sentence: (spl, obj) => sentence()
};
/* eslint-enable no-unused-vars */

function generate(kind, obj) {
  const spl = kind.split(',');

  if (parsers.hasOwnProperty(spl[0])) {
    return parsers[spl[0]](spl, obj);
  }
  return spl[0];
}

const maker = (defs) => {
  const nObjects = defs.n || DEFAULT_N;
  const out = [];

  for (let i = 0; i < nObjects; i++) {
    const obj = {};

    obj.id = i;
    obj.time = Date.now();

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
    out.push(obj);
  }
  return out;
};

export default maker;
