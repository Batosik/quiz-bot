require('dotenv').config()
const {Bot, Keyboard, InlineKeyboard, GrammyError, HttpError} = require('grammy')
const bot = new Bot(process.env.BOT_API_KEY);
const {getRandomQuestion, getCorrectAnswer, topics} = require('./utils');

bot.command('start', async (ctx) => {
  const startKeyboard = new Keyboard()
    .text('Разминка')
    .text('ЧГК')
    .row()
    .text('Даты')
    .text('Медиа')
    .resized()
  await ctx.reply(
    'Привет! 👋 \nДобро пожаловать на квиз! \nЯ буду твоим проводником в этом увлекательном путешествии по вопросам и ответам. Вместе мы прокачаем твои навыки! 🧠  \nГотов начать игру?' ,
  )
  await ctx.reply('Выбери раздел 👇', {
    reply_markup: startKeyboard
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
    inlineKeyboard = new InlineKeyboard().text(
      'A', 
      JSON.stringify({
        type: topic,
        qID: question.questionID,
    }))
  };
  await ctx.reply(question.text, {
    reply_markup: inlineKeyboard,
  });
});

bot.on('callback_query:data' , async (ctx) => {
  const callbackData = JSON.parse(ctx.callbackQuery.data)
  if (!callbackData.type.includes('option')) {
    const answer = getCorrectAnswer(callbackData.type, callbackData.qID)
    await ctx.reply(answer, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    })
    await ctx.callbackQuery();
    return;
  }

  if (callbackData.isCorrect) {
    await ctx.reply("👍")
    await ctx.callbackQuery();
    return;
  }

  const answer = getCorrectAnswer(callbackData.type.split('-')[0], callbackData.qID);
  await ctx.reply(`Неверно ❌. Правильный ответ: ${answer} `)
  await ctx.callbackQuery();
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