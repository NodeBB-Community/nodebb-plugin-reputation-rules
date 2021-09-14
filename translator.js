'use strict';

const fs = require.main.require("fs");

const LANGUAGE_DIR = __dirname + '/public/languages/';

let languages, texts = null;

function replaceParams(message, params) {
    if (!params) return message;

    return message.replace(/%(\d+)/gi, (match, captured) => { return params[captured]; });
}

function languageSupported(language) {
    return languages.indexOf(language) !== -1;
}

let translator = {
    translate(text, params, language, defaultLanguage) {
        if (!languageSupported(language)) {
            language = defaultLanguage || 'en_GB';
        }

        if (texts[language][text]) {
            return replaceParams(texts[language][text], params);
        } else {
            return text;
        }
    }
};

function loadLanguageTexts(language) {
    let allPhrases = {};
    fs.readdirSync(LANGUAGE_DIR + language).forEach(function (phrasesFile) {
        let phrases = require(LANGUAGE_DIR + language + '/' + phrasesFile);
        for (let phraseKey in phrases) {
            allPhrases[phraseKey] = phrases[phraseKey];
        }
    });
    return allPhrases;
}

function loadTexts() {
    languages = [];
    texts = [];
    fs.readdirSync(LANGUAGE_DIR).forEach(function (langFolder) {
        languages.push(langFolder);
        texts[langFolder] = loadLanguageTexts(langFolder);
    });
}

loadTexts();
module.exports = translator;
