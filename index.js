const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const Schema = mongoose.Schema;

// user
const userSchema = new Schema({
  username: {type: String, required: true}
});

let userModel = mongoose.model("user", userSchema);

// exercise
const exerciseSchema = new Schema({
  userId: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date, default: new Date()}
});

let exerciseModel = mongoose.model("exercise", exerciseSchema);


app.use(cors());
app.use(express.static('public'));

app.use("/", bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users', (req, res) => {
  let username = req.body.username;

  // create user and save on mongo
  let newUser = new userModel({ username: username });
  newUser.save();
  res.json(newUser);
});

// get users
app.get('/api/users', (req, res) => {
  userModel.find({}).then((users) => {
    res.json(users);
  });
});

app.post('/api/users/:id/exercises', (req, res) => {
  console.log(req.body);

  let userId = req.params._id;

  exerciseObj = {
    userId: userId,
    description: req.body.description,
    duration: req.body.duration
  }

  // data exist
  if(req.body.date != '') {
    exerciseObj.date = req.body.date;
  }

  let newExercise = new exerciseModel(exerciseObj);

  userModel.findById(userId, (err, userFound) => {
    // user not found
    if(err) {
      console.log(err);
    }

    // save exercise in mongo
    newExercise.save();
    res.json({
      _id: userFound._id,
      username: userFound.username,
      description: newExercise.description,
      duration: newExercise.duration,
      date: new Date(newExercise.date).toDateString()
    });
  });
});

app.get('/api/users/:id/logs', (req, res) => {

  let fromParam = req.query.from;
  let toParam = req.query.to;
  let limitParam = req.query.limit;
  let userId = req.params._id;

  // param limit exist, set to a integer
  limitParam = limitParam ? parseInt(limitParam): limitParam;

  userModel.findById(userId, (err, userFound) => {
    if(err) {
      return console.log(err);
    }

    console.log(userFound);

    let queryObj = {
      userId: userId
    };

    // date exist, add date param to the query
    if(fromParam || toParam) {
      
      queryObj.date = {}

      // date from params
      if(fromParam) {
        queryObj.date['$gte'] = fromParam;
      }

      // date to params
      if(toParam) {
        queryObj.date['$lte'] = toParam;
      }
    }

    exerciseModel.find(queryObj).limit(limitParam).exec((err, exercises) => {

      if(err) {
        return console.log(err);
      }

      let resObj = {
        _id: userFound._id,
        username: userFound.username
      }

      exercises = exercises.map((x) => {
        return {
          description: x.description,
          duration: x.duration,
          date: new Date(x.date).toDateString()
        }
      });

      resObj.log = exercises;
      resObj.count = exercises.length;

      res.json(resObj);
    })
  })
})

// da continuare

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
