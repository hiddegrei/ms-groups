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
  console.log(req.body.groupName);
  admin
    .firestore()
    .collection("users")
    .doc(req.params.userId)
    .collection("groups")
    .doc(req.body.groupName)
    .set({
      groupName: req.body.groupName,
      members: JSON.parse(req.body.members),
    })
    .catch((err) => {
      console.log(err);
      res.json(err);
    });
});


app.get("/api/users/:userId/groups", (req, res) => {
let docss = [];


function resolveAfterEnd() {
  return new Promise((resolve) => {
    admin
      .firestore()
      .collection("users")
      .doc(req.params.userId)
      .collection("groups")
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc, index) => {
          docss.push({data:doc.data(),membersData:[]});
          // console.log(doc.data());
        });
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

  function resolveAfterEnd2(member, index) {
    console.log(member,"69")
    return new Promise((resolve) => {
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
          docss[index].membersData.push({ name: member, waterIntakeToday: json.data.waterIntake });
           }
         
          //newData[index1].membersData[index2] = { name: member, waterIntakeToday: json.data.waterIntake };

          resolve("succes");
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }
  async function f2(member, index) {
    const x = await resolveAfterEnd2(member, index);
  }
  async function loopie(group,index) {
    console.log(group,"97")
    for (let i = 0; i < group.members.length; i++) {
      const result = await f2(group.members[i], index);
     
    }
  }
  async function f3(){
    // docss.map((doc, index) => {
    //   loopie(doc.data, index);
    // });
    for(let i=0;i<docss.length;i++){
       await loopie(docss[i].data,i)
    }
  }
  f1().then(()=>{
    // for(let i=0;i<docss.length;i++){
    //    loopie(docss[i].data,i)
    // }
    f3().then(()=>{
      console.log(docss, "111");
      res.json({ data: docss });

    })
    
    
    

  })
  

})



exports.app = functions.https.onRequest(app);
