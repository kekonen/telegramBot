kill $(ps aux | grep node | grep Bot.js | awk '{print $2}')
kill $(ps aux | grep node | grep main.js | awk '{print $2}')
