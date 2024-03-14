require('dotenv').config()
const {Bot, Keyboard, InlineKeyboard, GrammyError, HttpError, SessionFlavor, session, Composer } = require('grammy')
const {getRandomQuestion, getCorrectAnswer, topics} = require('./utils');

const bot = new Bot(process.env.BOT_API_KEY);

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


bot.use(
  session({
    initial: () => ({
      currentQuestionIndex: 0,
      score: 0,
      WWWNumber: 0
    }),
  })
)


bot.callbackQuery('Поехали', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.reply('/startquiz')
})

const quizComposer = new Composer(bot)

quizComposer.command("startquiz", async (ctx) => {
  ctx.session.currentQuestionIndex = 0
  ctx.session.score = 0
  ctx.session.WWWNumber = 0
  await ctx.reply("Первый раунд")
  await askQuestion(ctx)
})

async function askQuestion(ctx) {
  if (ctx.session.WWWNumber < 5) {
    const question = getRandomQuestion('WWW').question
    await ctx.reply(question.text)
    ctx.api.sendMessage(ctx.chat.id, question.text)
    await ctx.reply("Enter your answer:")
    quizComposer.on('text', async (ctx) => {
      const userAnswer = ctx.message.text.trim().toLowerCase()
      const correctAnswer = question.answer.toLowerCase()
      
      if (userAnswer === correctAnswer) {
        ctx.session.score += 20
        await ctx.reply('👍')
      } else {
        await ctx.reply('❌')
        await ctx.reply(`Правильный ответ: ${correctAnswer} `)
      }
      ctx.session.WWWNumber += 1
      await askQuestion(ctx)
    })
  } else {
    await ctx.reply(`Раунд завершен! Ты набрал ${ctx.session.score} `)
  }
}

quizComposer.command("stop", async (ctx) => {
  await ctx.reply("Quiz stopped.")
  ctx.session.currentQuestionIndex = 0
})

bot.use(quizComposer)


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
  const question = getRandomQuestion(topic).question;
  
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