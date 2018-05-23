#! /usr/bin/env node

var request = require('request');
var cheerio = require('cheerio');
var chalk = require('chalk');
var stripAnsi = require('strip-ansi');
var opts = require("nomnom").parse();

var query = opts._.join('%20');

var url = 'https://www.etymonline.com/word/' + query;

request(url, function (error, response, body) {
  if (error || response.statusCode !== 200) {
    console.error('no results found.');
    return;
  }
  var $ = cheerio.load(body);
  var defs = $('[class^="word--"]');
  defs.each(function (d, el) {
    let term = $(el).find('[class^="word__name--"]')[0];
    console.log('\n' + chalk.bold($(term).text().trim()) + '\n');
    let paras = $(el).find('[class^="word__defination--"] p');
    paras.each(function (d, el) {
      let text = format(el).trim();
      text = text.replace(/"[^"]+"/g, function(text) {
        return chalk.whiteBright(text);
      });
      if (text) {
        console.log(ragged(text, process.stdout.columns) + '\n');
      }
    });
  });
});

function ragged(text, width) {
  let wrapped = '';
  let len = 0;
  let words = text.split(/[ ]+/);
  while (words.length > 0) {
    let word = words[0];
    let wlen = stripAnsi(word).length;
    if (len + wlen < width) {
      wrapped += word + ' ';
      len += wlen + 1;
    } else {
      wrapped += '\n' + word + ' ';
      len = wlen + 1;
    }
    words.shift();
  }
  return wrapped;
}

function format (el) {
  if (el.type === 'text') {
    return el.data;
  }
  if (el.type === 'tag') {
    let text = el.children.map(format).join('');
    switch (el.name) {
      case 'a':
        return chalk.cyan.underline(text);
      case 'em':
      case 'i':
      case 'span':
        return chalk.italic.yellow(text);
      case 'b':
      case 'strong':
        return chalk.bold(text);
      default:
        return text;
    }
  }
  return '';
}
