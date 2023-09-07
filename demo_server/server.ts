const { Permit } = require("permitio");
var cors = require('cors');

const express = require("express");
const app = express();
const port = 4000;
app.use(express.json())
app.use(cors({
  origin: '*'
}));
// This line initializes the SDK and connects your Node.js app
// to the Permit.io PDP container you've set up in the previous step.
const permit = new Permit({
  // in production, you might need to change this url to fit your deployment
  pdp: "https://cloudpdp.api.permit.io",
  // your api key
  token: "permit_secret_XXXXXXXXXXXXX"
});

// You can open http://localhost:4000 to invoke this http
// endpoint, and see the outcome of the permission check.
app.get("/", async (req, res) => {
  const permitted = await permit.check(req.query.user, req.query.action, req.query.resource);

  if (permitted) {
    res.status(200).send({ permitted: true });
  } else {
    res.status(403).send({ permitted: false });
  }
});

// post that gets list of action and resources and checks them against the permit.io pdp
app.post("/", async (req, res) => {
  console.log(req.body.resourcesAndActions);
  const resourcesAndActions = req.body.resourcesAndActions;
  // iterate on resourcesAndActions and check them against the permit.io pdp with for loop
  const permittedList = [];
  for (let resourceAndAction of resourcesAndActions) {
    const resourceObj = {"type": resourceAndAction.resource, "attributes": resourceAndAction.resourceAttributes};
    const permitted = await permit.check(req.query.user, resourceAndAction.action, resourceObj);
    console.log('permitted: ' + permitted);
    permittedList.push(permitted);
  }
  res.status(200).send({ permittedList: permittedList });
});



app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
