const functions = require("firebase-functions");
const express = require("express");
const bodyParser = require("body-parser");
var rp = require("request-promise");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
// import { fetch } from "node-fetch";

const cors = require("cors")({ origin: true });
const app = express();
app.use(cors);
const admin = require("firebase-admin");
var jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });

admin.initializeApp();
///api/users/:userId/groups/add
app.post("/api/users/:userId/groups", urlencodedParser, (req, res) => {
  console.log(req.body.members);
  let arr=req.body.members.split(",")
  admin
    .firestore()
   
    .collection("groups")
    .add({
      groupName: req.body.groupName,
      members: arr,

    }).then((doc)=>{
      arr.map((member)=>{
        admin
    .firestore()
    .collection("users")
    .doc(member)
    .collection("groups")
    .doc(doc.id)
    .set({
      groupName: req.body.groupName,
      docId:doc.id
    })
    .catch((err) => {
      console.log(err);
      res.json(err);
    });
      })

    })
    .catch((err) => {
      console.log(err);
      res.json(err);
    });

    
});

app.get("/api/users/:userId/groups", (req, res) => {
  let doccs=[]
  admin
  .firestore()
  .collection("users")
  .doc(req.params.userId)
  .collection("groups")
  .get()
  .then((querySnapshot) => {
    querySnapshot.forEach((doc, index) => {
      doccs.push({data:doc.data()});
      // console.log(doc.data());
    });
  })
  .then(() => {
    res.send({data:doccs})
   
  })
  .catch((err) => {
    console.log(err);
  });


})


app.get("/api/users/:userId/groups/:groupId", (req, res) => {
let groupData;


function resolveAfterEnd() {
  return new Promise((resolve) => {
    admin
      .firestore()
      
      .collection("groups")
      .doc(req.params.groupId)
      .get()
      .then((doc) => {
        // querySnapshot.forEach((doc, index) => {
        //   docss.push({data:doc.data()});
        //   // console.log(doc.data());
        // });
        groupData={data:doc.data(),membersData:[]}
      })
      .then(() => {
        resolve("succes");
      })
      .catch((err) => {
        console.log(err);
      });
  });
}
async function f1() {
  const x = await resolveAfterEnd();
}

  function resolveAfterEnd2(member) {
   
    return new Promise((resolve) => {
      console.log(member,"69")
      fetch(`https://us-central1-ms-waterintake.cloudfunctions.net/app/api/users/${member}/waterintake/today`, {
        method: "GET", // or 'PUT',

        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
      })
        .then((res) => res.json())
        .then((json) => {
          console.log(json, "80")
           if(Object.keys(json).length != 0){
          groupData.membersData.push({ name: member, waterIntakeToday: json.data.waterIntake });
          resolve("succes");
           }
         
          //newData[index1].membersData[index2] = { name: member, waterIntakeToday: json.data.waterIntake };

          
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }
  async function f2(member) {
    const x = await resolveAfterEnd2(member);
  }
  async function loopie(group) {
    
    for (let i = 0; i < group.data.members.length; i++) {
      const result = await f2(group.data.members[i]);
    }
  }
  async function f3(){
    // docss.map((doc, index) => {
    //   loopie(doc.data, index);
    // });
    await loopie(groupData)
    
  }
  f1().then(()=>{
    // for(let i=0;i<docss.length;i++){
    //    loopie(docss[i].data,i)
    // }
    f3().then(()=>{
     console.log(groupData)
      res.json({ data: groupData });

    })
    
    
    

  })
  

})



exports.app = functions.https.onRequest(app);
