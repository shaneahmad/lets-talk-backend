// const dotenv = require("dotenv")
// dotenv.config();
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const colors = require("colors");
const express = require("express")
const chats = require("./data/data.js")
const connectDB = require("./config/db");
connectDB();
const app = express();
const userRoutes = require("./routes/userRoutes.js");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes.js");
const { error } = require('console');
const {notFound, errorHandler} = require('./middleware/errorMiddleware.js')


app.use(express.json());

// app.get('/',(req, res) =>{
//     res.send("Hello World");
// });


// app.use(notFound);
// app.use(errorHandler);

app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);


// --------------------------deployment------------------------------

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// --------------------------deployment------------------------------


const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, console.log(`Server started on PORT ${PORT}`.yellow.bold));

const io = require('socket.io')(server, {
    pingTimeout:60000,
    cors: {
        origin: "https://lets-talk-ok16.onrender.com",
    },
});

io.on("connection", (socket) => {
    console.log("Connected to socket.io");
    socket.on("setup", (userData) => {
      socket.join(userData._id);
      socket.emit("connected");
    });
  
    socket.on("join chat", (room) => {
      socket.join(room);
      console.log("User Joined Room: " + room);
    });
    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));
  
    socket.on("new message", (newMessageRecieved) => {
      var chat = newMessageRecieved.chat;
  
      if (!chat.users) return console.log("chat.users not defined");
  
      chat.users.forEach((user) => {
        if (user._id == newMessageRecieved.sender._id) return;
  
        socket.in(user._id).emit("message recieved", newMessageRecieved);
      });
    });
    socket.off("setup", () => {
        console.log("USER DISCONNECTED");
        socket.leave(userData._id);
    });
});
