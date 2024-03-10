const questions = require('./questionBank.json');

const topics = {
  "Разминка": "warmUp", 
  "ЧГК": "WWW", 
  "Даты": "dates", 
  "Медиа": "media"
}

const getRandomQuestion = (topic) => {
  const questionTopic = topic;
  const randomID = Math.floor(Math.random() * questions[questionTopic].length);
  return questions[questionTopic][randomID]
}

const getCorrectAnswer = (topic, id) => {
  const question = questions[topic].find((question) => question.questionID === id);
  console.log(question.options)
  if (!question.hasOptions) {
    return question.answer
  } 
  return question.options.find((option) => option.isCorrect).text
};

module.exports = { getRandomQuestion, getCorrectAnswer, topics};