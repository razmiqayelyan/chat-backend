const asyncHandler = require("express-async-handler");
const User = require("../schema/userSchema")
const Chat = require("../schema/chatSchema")

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
const accessChat = asyncHandler(async(req, res) => {
  const {userId} = req.body
  if(!userId) res.sendStatus(400)

  let isChat = await Chat.find({
    isGroupChat:false,
    $and: [
      {users: {$elemMatch: {$eq : userId}}},
      {users: {$elemMatch: {$eq : req.user._id}}},

    ]
  }).populate("users", "-password").populate("latestMessage")
  isChat = await User.populate(isChat, {
    path:"latestMessage.sender",
    select:"name pic email"
  })

  if(isChat.length > 0){
    res.status(200).send(isChat[0])
  }
  else{
    chatData = {
      chatName:"sender",
      isGroupChat:false,
      users:[userId, req.user._id]
    }
    try {
      let chat = await  Chat.create(chatData)
      let FullChat = await Chat.findById(chat.id).populate("users", "-password").populate("latestMessage")
      res.status(200).json(FullChat) 
      
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
})

//@description     Fetch all chats for a user
//@route           GET /api/chat/
//@access          Protected
const fetchChats = asyncHandler(async(req, res) => {
  try {
    await Chat.find({users: {$elemMatch:{$eq : req.user._id}}})
                  .populate("users", "-password")
                  .populate("groupAdmin", "-password")
                  .populate("latestMessage")
                  .sort({updatedAt:-1})
                  .then(async(results) => {
                    const result = await User.populate(results,{
                      path:"latestMessage.sender",
                      select:"name email pic"
                    })
                    res.status(200).send(result)
                  })
  } catch (error) {
    res.status(400)
    throw new Error(error.message)
  }
})

//@description     Create New Group Chat
//@route           POST /api/chat/group
//@access          Protected
const createGroupChat = asyncHandler(async(req, res) => {
  let {users, name} = req.body
  if (!users || !name) return res.status(400).send("Flease fill all the fields")
  users = JSON.parse(users)
  if (users.length < 2) {
        return res
          .status(400)
          .send("More than 2 users are required to form a group chat");
      }
  users.push(req.user)
  try {
    const groupChat = await Chat.create({
      isGroupChat:true,
      users,
      groupAdmin:req.user,
      chatName:name
    })
    const fullGroupChat = await Chat.findById(groupChat.id)
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    res.status(200).json(fullGroupChat)
  } catch (error) {
    res.status(400)
    throw new Error(error.message)
  }
})


// @desc    Rename Group
// @route   PUT /api/chat/rename
// @access  Protected
const renameGroup = asyncHandler(async(req, res) => {
  const { chatId, chatName } = req.body
  const updatedChat = await Chat.findByIdAndUpdate(chatId, { chatName },{ new:true }).populate("users", "-password").populate("groupAdmin", "-password")
  if(!updatedChat){
    res.status(404);
    throw new Error("Chat Not Found");
  }
  res.status(200).json(updatedChat) 
})


// @desc    Remove user from Group
// @route   PUT /api/chat/groupremove
// @access  Protected
const removeFromGroup = asyncHandler(async(req, res)=> {
  const {chatId, userId} = req.body
  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    { new:true }
  ) 
  .populate("users", "-password")
  .populate("groupAdmin", "-password");

  
  if(!removed){
    res.status(400)
    throw new Error("Chat not found")
  }
  res.status(200).json(removed)
})



// @desc    Add user to Group / Leave
// @route   PUT /api/chat/groupadd
// @access  Protected
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  // check if the requester is admin
  const userInGroup = await Chat.find({
      id:chatId,
      users: { $elemMatch: { $eq: userId }}
})
  if(userInGroup[0]){
    res.status(404);
    throw new Error("User is in Group");
  }
  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(added);
  }
});




module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};