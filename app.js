const express = require('express');
const exphbs = require('express-handlebars');
const morgan = require('morgan');
const Handlebars = require('handlebars');
const momment = require('moment')
const H = require('just-handlebars-helpers');
 

const app = express();

app.use(express.static('public'));


app.engine('hbs', exphbs({
  defaultLayout: 'main.hbs',
  layoutsDir: 'views/_layouts',
}));
app.set('view engine', 'hbs');

// Register just-handlebars-helpers with handlebars
H.registerHelpers(Handlebars);
require('./middlewares/locals.mdw')(app);
require('./middlewares/routes.mdw')(app);

// app.get('/', (req, res) => {
//   // res.end('hello from expressjs');
//   res.render('home');
// })

app.get('/faq', (req, res) => {
  res.render('faq');
})

app.get('/about', (req, res) => {
  res.render('about');
})



const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
})