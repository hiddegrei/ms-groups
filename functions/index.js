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

app.post("/api/users/:userId/groups/add", urlencodedParser, (req, res) => {
  console.log(req.body.groupName);
  admin
    .firestore()
    .collection("users")
    .doc(req.params.userId)
    .collection("groups")
    .doc(req.body.groupName)
    .set({
      groupName: req.body.groupName,
      members: req.body.members,
    })
    .catch((err) => {
      console.log(err);
      res.json(err);
    });
});

app.get("/api/users/:userId/groups/", (req, res) => {
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
            docss.push(doc.data());
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
  async function f2() {
    let newData = [...docss];
    function resolveAfterEnd2() {
      return new Promise((resolve) => {
        docss.map((group, index1) => {
          newData[index1].membersData = [];
          group.members.map((member, index2) => {
            console.log(member);
            fetch(`https://us-central1-ms-waterintake.cloudfunctions.net/app/api/users/${member}/waterintake/today`, {
              method: "GET", // or 'PUT',

              headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
              },
            })
              .then((res) => res.json())
              .then((json) => {
                newData[index1].membersData.push({ name: member, waterIntakeToday: json.data.waterIntake });
                console.log(newData[index1].membersData.length, group.members.length);
                //newData[index1].membersData[index2] = { name: member, waterIntakeToday: json.data.waterIntake };
                if (newData[index1].membersData.length === group.members.length) {
                  console.log("hi");
                  resolve("succes");
                }
              })
              .catch((err) => {
                console.log(err);
              });
          });
        });
      });
    }
    async function f3() {
      const x = await resolveAfterEnd2();
    }
    f3().then(() => {
      console.log(newData, "101");
      res.json({ data: newData });
      return newData;
    });
  }
  f1().then(() => {
    f2().then((doc) => {
      console.log(doc, "107");
      // res.json({ data: doc });
    });
  });
});

exports.app = functions.https.onRequest(app);
