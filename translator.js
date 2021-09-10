'use strict';

const fs = require.main.require("fs");

const LANGUAGE_DIR = __dirname + '/public/languages/';

let languages, texts = null;
loadTexts();

let translator = {
    translate: function (text, language, defaultLanguage) {
        if (!languageSupported(language)) {
            language = defaultLanguage || 'en_GB';
        }

        if (texts[language][text]) {
            return texts[language][text];
        } else {
            return text;
        }
    }
};

function loadTexts() {
    languages = [];
    texts = [];
    fs.readdirSync(LANGUAGE_DIR).forEach(function (langFolder) {
        languages.push(langFolder);
        texts[langFolder] = loadLanguageTexts(langFolder);
    });
}

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

function languageSupported(language) {
    return languages.indexOf(language) !== -1;
}

module.exports = translator;