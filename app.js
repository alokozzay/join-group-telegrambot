const TelegramAPI = require('node-telegram-bot-api')

const {Api,TelegramClient} = require('telegram')
const {StringSession} = require('telegram/sessions')

const fs = require("fs");

const apiId = 11362769;
const apiHash = "dc1ce6c21f8c20108820943b438c8def";
const Session = new StringSession(""); // fill this later with the value from session.save()

require('dotenv').config();

const keyboard =  require ('./module/keyboard')
const messageText =  require ('./module/text.js');
const { buildReplyMarkup } = require('telegram/client/buttons');

const bot = new TelegramAPI(process.env.TOKEN, { polling: true})
let delay = 10000;
let group;

let bool;

let firstNameAc = '💰 Займы до 30 000₽'
let lastNameAc = 'под 0%, за 10 минут, гражданам РФ💰'
let bioAc = 'Займы в боте - @excellent_zaym_bot'

let timer = async (n) => {
    return new Promise(resolve => {
        setTimeout(()=>{
            resolve(1);
        }, n);
    })
}

bot.onText(/\/start/, msg => {
    
    // переменная для хранение айдишника чата.
    const ChatId = msg.chat.id;
    // переменная для хранение имени пользователя.
    const UserName = msg.from.first_name;

    bot.sendMessage(ChatId, `Здравствуй ${UserName}, вы выбрали:\n\n🔝Главное Меню`,{ 
        parse_mode: "HTML",
        reply_markup: {
            keyboard: keyboard.start
        }
    });

})

bot.on('message', async msg => {

    const ChatId = msg.chat.id;
    const UserName = msg.from.username;
    const UserId = msg.from.id;
    const Name = msg.from.first_name;

    switch(msg.text) {
        case 'Запуск скрипта💸':
            bot.sendMessage(ChatId, messageText.number);
            bool = true;
            (async () => {
                  console.log("Loading interactive example...");
                  const client = new TelegramClient(Session, apiId, apiHash, {
                    connectionRetries: 5,
                  });
                  await client.start({
                    phoneNumber: () => new Promise(resolve => {
                        bot.on('message', msg => { 
                            resolve(msg.text)
                        })
                    }),
                    phoneCode: (err) => new Promise(resolve => {
                        bot.on('message', msg => { 
                            resolve(msg.text)
                        })
                        
                    }),
                    password: (err) => new Promise(resolve => {
                        bot.on('message', msg => { 
                            resolve(msg.text)
                        }) 
                    }),
                    onError: (err) => {
                        console.log(err);
                        const errorBot = err.errorMessage
                        bot.sendMessage(ChatId, `У вас ошибка: ${errorBot}, выполняется выход из функции!`);
                        return true
                    },
                    });
                    console.log("You should now be connected.");
                    await bot.sendMessage(ChatId, messageText.connected);
                    console.log(client.session.save()); // Save this string to avoid logging in again

                    await client.connect(); // This assumes you have already authenticated with .start()
                  
                    const result = await client.invoke(
                        new Api.account.UpdateProfile({
                            firstName: firstNameAc,
                            lastName: lastNameAc,
                            about: bioAc,
                        })
                        
                    );
                    
                    bot.sendMessage(ChatId, messageText.infachange);

                    for(let el of group){
                        try {
                            if (bool === true) {
                                const result = await client.invoke(
                                    new Api.channels.JoinChannel({
                                        channel: el,
                                        })
                                );
                                await timer(delay);
                            } else {
                                bot.sendMessage(ChatId, messageText.joinStop);
                                break;
                            }
                            
                        } catch (err) {
                            bot.sendMessage(ChatId, `${messageText.errorJoin} ${err.errorMessage} ${err.seconds}`);
                            if(err.errorMessage == 'FLOOD') {
                                bot.sendMessage(ChatId, `вернусь к работе через ${err.seconds}`);
                                await timer(err.seconds);
                            }
                            await timer(delay);
                            continue;
                        }  
                    }                   
                })();
            break

        case 'Обновить список Групп': 
            bot.sendMessage(ChatId, messageText.group);
            bot.on('document', msg => { 
                // console.log(msg)

                bot.downloadFile(msg.document.file_id, __dirname).then(fileName => {
                    console.log(fileName)
                    fs.readFile(fileName, "utf8",  function(error,data){
                        if (error) {
                            console.log(error)
                            bot.sendMessage(ChatId, messageText.groupbad);  
                            return false
                        } else {
                            group = data.split("\r\n");
                        }
                        
                    });

                    fs.unlink(fileName, err => {
                        if(err) { // не удалось удалить файл
                            console.log(err);
                        } else {
                            console.log('Файл успешно удалён');
                            bot.sendMessage(ChatId, messageText.groupgood);  
                        }
                     });
                 return 0;    
                }) 
                          
            })
            break
        case 'Остановить функцию': 
            bool = false;
            break
        
    }
})

