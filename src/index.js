// @flow
/* eslint-disable no-magic-numbers */

import Random from 'random-js';
import moment from 'moment';
import fs from 'fs';

const DEFAULT_N = 100;

const CONSONANTS = ['b', 'c', 'ch', 'd', 'g', 'j', 'k', 'l', 'm',
  'n', 'p', 'r', 's', 't', 'th', 'v', 'w', 'y', 'z', '', '', '', ''];
const VOWELS = ['a', 'e', 'i', 'o', 'u', 'ai', 'oi', 'ei', 'au', 'ou'];
const MAX_SYLS = 2;

const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz'.split('');

const STREETS = ['St', 'Ave', 'Blvd', 'Pkwy', 'Dr', 'Circ', 'Way', 'Road', 'Lane', 'Terr', 'Hwy'];

// eslint-disable-next-line no-sync
const KANJI = fs.readFileSync('kanji.txt', 'utf8')
  .trim()
  .split('');

const mt = Random.engines.mt19937();

mt.autoSeed();

function setSeed(n) {
  mt.seed(n);
  console.log(`seeded rng to ${n}`);
  return 'foo';
}
setSeed.doc = 'Seed the RNG to a given value, for predictable results';
setSeed.args = ['seed'];

function rand() {
  return Random.real(0, 1.0)(mt);
}
rand.doc = 'Generates a random 32-bit float between 0 and 1';

function choice(ar) {
  return ar[Math.floor(ar.length * rand())];
}
choice.doc = 'Chooses randomly between given options';
choice.args = ['...options'];

function deal(count, ar) {
  return Random.sample(mt, ar, count);
}
deal.doc = 'Chooses a given number of objects from an array without repeats';
deal.args = ['array', 'count'];

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const HEX = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

function string(source, len) {
  const array = [];

  for (let i = 0; i < len; i++) {
    array.push(choice(source));
  }
  return array.join('');
}
string.doc = 'Generates a string using the given alphabet';
string.args = ['alphabet', 'length'];

function stringOf(source) {
  return (len) => string(source, len);
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
word.doc = 'Generates one lowercased word';
word.args = ['syllables'];

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
sentence.doc = 'Generates a sentence of gibberish';

function name() {
  return `${capWord()} ${capWord()}`;
}
name.doc = 'Generates a full name (first and last)';

function capWord() {
  return titleCase(word(int(1, MAX_SYLS)));
}

function kanji(n) {
  return string(KANJI, n);
}

function uuid() {
  return Random.uuid4(mt);
}

function streetAddress() {
  return `${int(1, 25000)} ${capWord()} ${choice(STREETS)}`;
}

function zipCode(region) {
  switch (region.toLowerCase()) {
  case 'us':
    return template('00000');
  case 'ca':
    return template('A0A 0A0');
  default:
    return template('AAA 000');
  }
}

function license() {
  return template(choice(['AAA000', '000AAA', 'AAA0000', '0AAA000', 'AAAAAAA']));
}
license.doc = 'Generates a random license plate';

function template(st) {
  let out = '';

  for (const ch of st.split('')) {
    switch (ch) {
    case 'A':
      out += choice(ALPHA_UPPER);
      break;
    case 'a':
      out += choice(ALPHA_LOWER);
      break;
    case '0':
      out += choice(DIGITS);
      break;
    case '1':
      out += choice(DIGITS.slice(1));
      break;
    default:
      out += ch;
    }
  }
  return out;
}
template.doc = 'Generates a random string based on a template (use A, a, and 0)';

function address(region) {
  if (bool()) {
    return `${streetAddress()}, ${capWord()}, ${template('AA')} ${zipCode(region)}`;
  }
  return `${streetAddress()}, ${choice(['Apt', 'Unit', 'Bldg'])} ${int(1, 999)}, `
    + `${capWord()}, ${template('AA')} ${zipCode(region)}`;
}
address.doc = 'Generates a random complete address given a region (currently just US and CA)';
address.args = 'region';

function email() {
  return `${string(ALPHA_LOWER, int(2, 10))}@${string(ALPHA_LOWER, int(2, 10))}.`
    + `${choice(['com', 'org', 'net', 'gov'])}`;
}
email.doc = 'Generates a random email address';

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
int.doc = 'Generates an integer between [min] and [max] inclusive';
int.args = ['min', 'max'];

function normal(mu, sigma, min, max) {
  // note: this is not exactly normal, but a close approximation using the Irwin-Hall distribution
  let acc = 0;

  for (let i = 0; i < IH_STEPS; i++) {
    acc += rand();
  }

  const result = mu + (sigma * (acc - (IH_STEPS / 2)));

  return clamp(result, min, max);
}
normal.doc = 'Generates a number using a normal distribution, clamped between [min] and [max]';
normal.args = ['mu', 'sigma', 'min', 'max'];
// useful as a synonym
const norm = normal;

function med3(max) {
  let a = int(1, max);
  let b = int(1, max);
  let c = int(1, max);

  if (a > b) { [a, b] = [b, a] }
  if (b > c) { [b, c] = [c, b] }
  if (a > b) { [a, b] = [b, a] }

  return b;
}
med3.doc = 'Generates the median of three random numbers between 1 and [max]';
med3.args = ['max'];

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
poisson.doc = 'Generates a number using a Poisson distribution with mean [lambda]';
poisson.args = ['lambda'];

function latlong() {
  // these values should end up uniformly distributed over the sphere
  const theta = (rand() * 360) - 180;
  const pi = (360 / Math.PI * Math.asin(Math.sqrt(rand()))) - 90;

  return [pi, theta];
}
latlong.doc = 'Generates a lat / long pair';

function phone() {
  return `${string(DIGITS, 3)}-${string(DIGITS, 3)}-${string(DIGITS, 4)}`;
}
phone.doc = 'Generates a formatted 10-digit phone number';

const digits = stringOf(DIGITS);

digits.doc = 'Generates a string of decimal digits';
digits.args = ['length'];

const hex = stringOf(HEX);

hex.doc = 'Generates a string of hexadecimal digits';
hex.args = ['length'];

function date() {
  const epoch = Random.integer(0, 2 ** 40)(mt);

  return moment(epoch).toISOString();
}
date.doc = 'Generates a random date';

function bool(pTrue = 0.5) {
  return rand() < pTrue;
}
bool.doc = 'Generates a random boolean with given probability of truth';
bool.args = ['pTrue'];

// // // // // OBJECT GENERATOR // // // // //

class VariableError extends Error {}

function val(arg, obj) {
  if (arg.charAt(0) === '*') {
    if (obj.hasOwnProperty(arg.slice(1))) { return obj[arg.slice(1)] }

    throw new VariableError(arg.slice(1));
  } else if (arg.match(/d[0-9]+/)) {
    return int(1, parseInt(arg.slice(1)));
  } else if (arg.match(/[0-9]+/)) {
    return parseInt(arg);
  } else if (arg.match(/[0-9.]+/)) {
    return parseFloat(arg);
  }
  return arg;
}

function pack(args, obj) {
  const out = {};

  for (const field of args) {
    if (obj.hasOwnProperty(field)) {
      out[field] = obj[field];
    }
  }
  return out;
}

function zip(args, obj) {
  const out = [];

  for (let i = 0; i < obj[args[0]].length; i++) {
    const temp = {};

    for (const arg of args) {
      temp[arg] = obj[arg][i];
    }
    out.push(temp);
  }
  return out;
}

/* eslint-disable object-property-newline */
// It's silly to put these one per line.
export const generators = {
  name, word, int, med3, normal, norm, poisson, choice,
  latlong, digits, hex, string, phone, sentence,
  pack, date, rand, bool, deal, kanji, uuid, setSeed,
  license, address, template, email
};
/* eslint-enable object-property-newline */

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
  digits:   (spl, obj) => generators.digits(val(spl[1], obj)),
  hex:      (spl, obj) => generators.hex(val(spl[1], obj)),
  string:   (spl, obj) => string(spl[1].split(''), val(spl[2], obj)),
  phone:    (spl, obj) => generators.phone(),
  sentence: (spl, obj) => sentence(),
  pack:     (spl, obj) => pack(spl.slice(1), obj),
  date:     (spl, obj) => date(),
  zip:      (spl, obj) => zip(spl.slice(1), obj),
  bool:     (spl, obj) => bool(spl[1]),
  kanji:    (spl, obj) => kanji(spl[1]),
  deal:     (spl, obj) => deal(spl[1], spl.slice(2)),
  rand:     (spl, obj) => rand(),
  setSeed:  (spl, obj) => setSeed(spl[1]),
  uuid:     (spl, obj) => uuid(),
  license:  (spl, obj) => license(),
  address:  (spl, obj) => address(spl[1]),
  template: (spl, obj) => template(spl[1]),
  email:    (spl, obj) => email()
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

        if (key.match(/.*:((d?)[0-9])|(\*)+/)) {
          const [keyBase, repsBase] = key.split(':');

          const reps = val(repsBase, obj);

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
