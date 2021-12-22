//172.31.16.124
const express = require('express');
const app = express();
app.use(bodyParser.json())
const PORT = 3000;

app.get('/', (req, res) => {
  res.status(200).send('the request was received')
})

app.listen(PORT, ()=>{console.log(`listening on ${PORT} at ${new Date().toLocaleTimeString()}`)});