const { Permit } = require('permitio');
var cors = require('cors');

const express = require('express');
const app = express();
const port = 4000;
app.use(express.json());
app.use(
  cors({
    origin: '*',
  }),
);
// This line initializes the SDK and connects your Node.js app
// to the Permit.io PDP container you've set up in the previous step.
const permit = new Permit({
  // in production, you might need to change this url to fit your deployment
  pdp: 'https://cloudpdp.api.permit.io',
  // your api key
  token: 'permit_secret_XXXXXXXXXXXXX',
});

// You can open http://localhost:4000 to invoke this http
// endpoint, and see the outcome of the permission check.
app.get('/', async (req, res) => {
  const permitted = await permit.check(req.query.user, req.query.action, req.query.resource);

  if (permitted) {
    res.status(200).send({ permitted: true });
  } else {
    res.status(403).send({ permitted: false });
  }
});

// POST that gets list of action and resources and checks them against the Permit.io PDP
app.post('/', async (req, res) => {
  const { resourcesAndActions } = req.body;
  const { user: userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'No userId provided.' });
  }

  const checkPermissions = async (checkParams) => {
    const { resource, action, userAttributes, resourceAttributes } = checkParams;
    return permit.check(
      {
        key: userId,
        attributes: userAttributes,
      },
      action,
      {
        type: resource,
        attributes: resourceAttributes,
      },
    );
  };

  const permittedList = await Promise.all(resourcesAndActions.map(checkPermissions));

  return res.status(200).json({ permittedList });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
