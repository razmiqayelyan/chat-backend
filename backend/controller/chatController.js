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
  if (!users || !name || !name.trim()) return res.status(400).send("Flease fill all the fields")
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
  let removed;
  if(userId === req.user.id){
    removed = await Chat.findByIdAndUpdate(
      chatId,
      {
        $pull: { users: userId },
      },
      { new:true }
    ) 
    .populate("users", "-password")
    .populate("groupAdmin", "-password");
  } 
   else {
    removed = await Chat.findOneAndUpdate(
    {_id : chatId, groupAdmin:req.user._id},
    {
      $pull: { users: userId },
    },
    { new:true }
  ) 
  .populate("users", "-password")
  .populate("groupAdmin", "-password");
  }
  
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
      _id:chatId,
      users: { $elemMatch: { $eq: userId }},
      isGroupChat:true
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


// TEST ENVORIMENT


// const accessChat = asyncHandler(async(req ,res) => {
//   const {userId} = req.body

//   if(!userId) return res.sendStatus(400)

//   let chat = await Chat.find({
//     isGroupChat:false,
//     $and:[
//       {users :{$elemMatch : {$eq: req.user._id}}},
//       {users :{$elemMatch : {$eq: userId}}}
//     ]
//   })
//     .populate("users", "-password")
//     .populate("latestMessage")

//     chat = await User.populate(chat, {
//       path:"latestMessage.sender",
//       select:"name email pic"
//     })
//     if(chat.length > 0){
//       res.send(chat)
//     }
//     else{
//       const chatData = {
//         isGroupChat:false,
//         chatName:"sender",
//         users:[req.user._id, userId]
//       }
//       try {
//         let newChat = await Chat.create(chatData)
//             newChat = await Chat.findById(newChat.id)
//             .populate("users", "-password")
//             .populate("latestMessage")
//             res.send(newChat)
        
//       } catch (error) {
//         res.status(400)
//         throw new Error(error.message)
//       }
//     }
// })

// const fetchChats = asyncHandler(async(req, res) => {
//   try {
//     let chat = await Chat.find({
//       users: {$elemMatch : {$eq : req.user._id}}
//     })
//       .populate("users", "-password")
//       .populate("groupAdmin", "-password")
//       .populate("latestMessage")
//       .sort({updatedAt:-1})
//       .then(async(results) => {
//         const chats = await User.populate(results, {
//           path:"latestMessage.sender",
//           select:"name email pic"
//         })
//         res.status(200).json(chats)
//       })
//   } catch (error) {
//     res.status(400)
//     throw new Error(error.message)
//   }
// })


// const createGroupChat = asyncHandler(async(req ,res) => {
//   let {users , name} = req.body

//   if(!users || !name) return res.status(400).send("Please Fill All Fields")

//   users = JSON.parse(users)
//   if(users.length < 2) return res.status(400).send("Please Add more then 2 users for Creating group")
//   users.push(req.user)

//   try {
//     let groupChat = await Chat.create({
//       isGroupChat:true,
//       users,
//       groupAdmin:req.user,
//       chatName:name
//     }) 
//     groupChat = await Chat.findById(groupChat.id)
//       .populate("users", "-password")
//       .populate("groupAdmin", "-password")

//       res.status(200).json(groupChat)

//   } catch (error) {
//     res.status(400)
//     throw new Error(error.message)
//   }
// })

// const renameGroup = asyncHandler(async (req , res) => {
//   const {chatId, chatName} = req.body

//   if(!chatId || !chatName) return res.status(400).send("Group not Found")

//   const updatedChat = await Chat.findByIdAndUpdate(chatId, {
//     chatName
//   }, {new:true}) 
//   .populate("users", "-password")
//   .populate("groupAdmin", "-password")
//   if(updatedChat){
//     res.status(200).json(updatedChat)
//   }else{
//     res.status(200)
//     throw new Error("Group not Found")
//   }
// })

// const removeFromGroup = asyncHandler(async(req, res) => {
//   const { userId , chatId } = req.body

//   const removed = await Chat.findByIdAndUpdate(chatId,  
//         {
//           $pull: { users: userId },
//         }, 
//         {new:true}
//       )
//       .populate("users", "-password")
//       .populate("groupAdmin", "-password")
//   if(!removed) {
//     res.status(400)
//     throw new Error("Chat not Found")
//   }  
//   res.status(200).json(removed)
// })

// const addToGroup = asyncHandler(async (req, res) => {
//   const {userId, chatId} = req.body

//   const added = await Chat.findOneAndUpdate({
//     _id: chatId,
//     users: {$ne : userId}
//   }, 
//     {
//       $push: {users: userId}
//     }, {new : true})
//       .populate("users", "-password")
//       .populate("groupAdmin", "-password")

//   if(!added){
//     res.status(400)
//     throw new Error("Chat not Found or User Exist in this Chat")
//   }
//   res.status(200).json(added)
// })

// module.exports = {
//   accessChat,
//   fetchChats,
//   createGroupChat,
//   renameGroup,
//   removeFromGroup,
//   addToGroup
// };
