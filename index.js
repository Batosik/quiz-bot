require('dotenv').config()
const {Bot, Keyboard, InlineKeyboard, GrammyError, HttpError, session, Composer } = require('grammy')
const {getRandomQuestion, getCorrectAnswer, topics} = require('./utils');
const { userDB } = require('./users')

const bot = new Bot(process.env.BOT_API_KEY);

bot.api.setMyCommands([
  {
    command: 'start',
    description: 'Запуск бота'
  },
  {
    command: 'startquiz',
    description: 'Начало квиза'
  },
  {
    command: 'rules',
    description: 'Правила игры'
  },
  {
    command: 'rating',
    description: 'Твое место в рейтинге'
  },
  {
    command: 'top',
    description: 'Лидеры турнира SOON'
  }
])

bot.command('start', async (ctx) => {
  const startKeyboard = new InlineKeyboard()
    .text('Да!')
    .row()
    .text('Потренеруюсь 🤯')
  await ctx.reply(
    'Привет! 👋 \nДобро пожаловать на квиз! \nЯ буду твоим проводником в этом увлекательном путешествии по вопросам и ответам. Вместе мы прокачаем твои навыки! 🧠 \nГотов начать игру?' ,
    { reply_markup: startKeyboard
    })
})

bot.command("rules", async (ctx) => {
  await ctx.reply('Игра состоит из 3 блоков вопросов - Разминка, ЧГК и Даты. В каждом блоке по 4 вопроса.')
  setTimeout(() => {
    ctx.reply('Вопросы из блока\nРазминка - 10 баллов \nДаты - 15 баллов\nЧГК - 20 баллов.');
  }, 1000);
  setTimeout(() => {
    ctx.reply('Давай начнем?', {
      reply_markup: new InlineKeyboard()
      .text('Поехали')
    });
  }, 3000);
})

bot.command("rating", async (ctx) => {
  const plase = Number(userDB.place) + 1
  await ctx.reply(`Твое место в турнирной таблице ${plase}!`)
})

bot.callbackQuery("Да!", async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.reply('Игра состоит из 3 блоков вопросов - Разминка, ЧГК и Даты. В каждом блоке по 4 вопроса.')
  setTimeout(() => {
    ctx.reply('Вопросы из блока\nРазминка - 10 баллов \nДаты - 15 баллов\nЧГК - 20 баллов.');
  }, 1000);
  setTimeout(() => {
    ctx.reply('Давай начнем?', {
      reply_markup: new InlineKeyboard()
      .text('Поехали')
    });
  }, 3000);
})

bot.callbackQuery("Потренеруюсь 🤯", async (ctx) => {
  await ctx.answerCallbackQuery()
  const trainKeyboard = new Keyboard()
    .text('Разминка')
    .text('ЧГК')
    .row()
    .text('Даты')
    .text('Медиа')
    .resized()

  await ctx.reply('Выбери тип тренировки 👇', {
    reply_markup: trainKeyboard
  })
})

bot.callbackQuery('Поехали', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.reply('Нажми /startquiz')
})

function initial() {
  return {
    currentQuestionIndex: 0,
    score: 0,
    WWW: 0,
    warmUp: 0,
    dates: 0,
    pizzaCount: 0
  };
}

bot.use(session({ initial }));

const quizComposer = new Composer();

let quizSet = {question: 0, correctAnswer: 0, currentRound: 0, round: {warmUp: 10, WWW: 20, dates: 15}}
const roundsQuantity = 4

bot.command("hunger", async (ctx) => {
  const count = ctx.session.pizzaCount;
  await ctx.reply(`Your hunger level is ${count}!`);
  console.log(ctx.from)
  console.log(ctx.session)
  userDB.show()
});

bot.hears(/.*🍕.*/, (ctx) => ctx.session.pizzaCount++);

async function askQuestion(ctx) {
  if (ctx.session.warmUp < roundsQuantity) {
    let game = 'warmUp'
    quizSet.currentRound = 'warmUp'
    let question = getRandomQuestion(game)
    let inlineKeyboard;
    const buttonRows = question.options.map((option) => [
      InlineKeyboard.text(
        option.text,
        JSON.stringify({
          type: `${game}-option`,
          qID: question.questionID,
          isCorrect: option.isCorrect,
        }),
      ),
    ]);
    inlineKeyboard = InlineKeyboard.from(buttonRows);
    await ctx.reply(question.text, {
      reply_markup: inlineKeyboard,
    });
  }
if (ctx.session.WWW < roundsQuantity && ctx.session.warmUp === roundsQuantity) {
    if (ctx.session.WWW === 0){
      await ctx.reply(`Раунд завершен! Ты набрал ${ctx.session.score} баллов`);
      await ctx.reply ('🥁')
      await ctx.reply('Второй раунд');
      quizSet.currentRound = 'WWW';
    }
      game = 'WWW'
      question = getRandomQuestion(game)
      await ctx.reply(question.text)
      let correctAnswer = getCorrectAnswer(game, question.questionID)
      quizSet.question = question
      quizSet.correctAnswer = correctAnswer
  }
  if (ctx.session.WWW === roundsQuantity && ctx.session.dates < roundsQuantity) {
    let game = 'dates'
    if (ctx.session.dates === 0){
      await ctx.reply(`Раунд завершен! Ты набрал ${ctx.session.score} баллов`);
      await ctx.reply ('🥁')
      await ctx.reply('Третий раунд');
      quizSet.currentRound = 'dates';
    }
    question = getRandomQuestion(game)
    if (question.hasOptions) { 
      let inlineKeyboard;
      const buttonRows = question.options.map((option) => [
        InlineKeyboard.text(
          option.text,
          JSON.stringify({
            type: `${game}-option`,
            qID: question.questionID,
            isCorrect: option.isCorrect,
          }),
        ),
      ]);
    inlineKeyboard = InlineKeyboard.from(buttonRows);
    await ctx.reply(question.text, {
      reply_markup: inlineKeyboard,
    });

    } else {
      await ctx.reply(question.text)
      let correctAnswer = getCorrectAnswer(game, question.questionID)
      quizSet.question = question
      quizSet.correctAnswer = correctAnswer
    }
  }
  if (ctx.session.dates === roundsQuantity) {
    await ctx.reply(`Игра подошла к концу 🙌. Ты набрал ${ctx.session.score} баллов. Спасибо за игру!`)
    userDB.update(ctx.from.id, ctx.from.first_name, ctx.session.score)
    ctx.session.WWW = 0;
    ctx.session.warmUp = 0;
    ctx.session.dates = 0;
  }
}


bot.on('callback_query:data' , async (ctx) => {
  const callbackData = JSON.parse(ctx.callbackQuery.data)
  let game = quizSet.currentRound
  if (callbackData.isCorrect) {
    await ctx.answerCallbackQuery()
    await ctx.reply("👍")
    ctx.session.score += Number(quizSet.round[game])
  } else {  
    await ctx.answerCallbackQuery()
    const answer = getCorrectAnswer(callbackData.type.split('-')[0], callbackData.qID);
    await ctx.reply(`❌`)
    await ctx.reply(`Правильный ответ: ${answer} `)
  }
  ctx.session[game] += 1
  await askQuestion(ctx);
})

quizComposer.command('startquiz', async (ctx) => {
  await ctx.reply("Первый раунд");
  askQuestion(ctx);
});

bot.command('training', async (ctx) => {
  const trainKeyboard = new Keyboard()
    .text('Разминка')
    .text('ЧГК')
    .row()
    .text('Даты')
    .text('Медиа')
    .resized()

  await ctx.reply('Выбери тип тренировки 👇', {
    reply_markup: trainKeyboard
  })
})

bot.hears(['Разминка', 'ЧГК', 'Даты', 'Медиа'], async (ctx) => {
  const topic = topics[ctx.message.text];
  const question = getRandomQuestion(topic);
  
  let inlineKeyboard;

  if (question.hasOptions) {
    const buttonRows = question.options.map((option) => [
      InlineKeyboard.text(
        option.text,
        JSON.stringify({
          type: `${topic}-option`,
          qID: question.questionID,
          isCorrect: option.isCorrect,
        }),
      ),
    ]);
  inlineKeyboard = InlineKeyboard.from(buttonRows);
  } else {
    inlineKeyboard = InlineKeyboard.text('Узнать ответ')
  }
  await ctx.reply(question.text, {
    reply_markup: inlineKeyboard,
  });
});


bot.on('callback_query:data' , async (ctx) => {
  const callbackData = JSON.parse(ctx.callbackQuery.data)
  if (!callbackData.type.includes('option')) {
    const answer = getCorrectAnswer(callbackData.type, callbackData.qID)
    await ctx.reply(answer)
    await ctx.answerCallbackQuery();
    return;
  }

  if (callbackData.isCorrect) {
    await ctx.reply("👍")
    await ctx.answerCallbackQuery();
    return;
  }

  const answer = getCorrectAnswer(callbackData.type.split('-')[0], callbackData.qID);
  await ctx.reply(`❌`)
  await ctx.reply(`Правильный ответ: ${answer} `)

  await ctx.answerCallbackQuery();
})

quizComposer.on("message:text", async (ctx) => {
  let userAnswer = ctx.message.text.trim().toLowerCase()
  let correctAnswer = quizSet.correctAnswer
  let game = quizSet.currentRound
  if (userAnswer === correctAnswer.toLowerCase()) {
    ctx.session.score += Number(quizSet.round[game])
    await ctx.reply('👍')
  } else {
    await ctx.reply('❌')
    await ctx.reply(`Правильный ответ: ${correctAnswer} `)
  }
  ctx.session[game] += 1
  await askQuestion(ctx)
})

bot.use(quizComposer)

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});



bot.start();