'use strict';

var fs = require("fs");

var LANGUAGE_DIR = __dirname + '/public/languages/';

var languages, texts = null;
loadTexts();

var translator = {
    translate: function(text, language, defaultLanguage) {
        if (!languageSupported(language)) {
            language = defaultLanguage || 'en_GB';
        }

        return texts[language][text];
    }
};

function loadTexts() {
    languages = [];
    texts = [];
    fs.readdirSync(LANGUAGE_DIR).forEach(function(langFolder) {
        languages.push(langFolder);
        texts[langFolder] = loadLanguageTexts(langFolder);
    });
}

function loadLanguageTexts(language) {
    var allPhrases = {};
    fs.readdirSync(LANGUAGE_DIR + language).forEach(function(phrasesFile) {
        var phrases = require(LANGUAGE_DIR + language + '/' + phrasesFile);
        for (var phraseKey in phrases) {
            allPhrases[phraseKey] = phrases[phraseKey];
        }
    });
    return allPhrases;
}

function languageSupported(language) {
    return languages.indexOf(language) != -1;
}

module.exports = translator;