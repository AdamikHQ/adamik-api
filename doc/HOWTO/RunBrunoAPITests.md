## Usage

### Setup

1. Create a `.env` file from the `.env.sample` provided [here](https://github.com/AdamikHQ/adamik-api/blob/main/src/tests/bruno/.env.sample)
2. Put a valid adamik API key in this `.env` file
3. Put a copy of this `.env` file in _each_ subfolder of: https://github.com/AdamikHQ/adamik-api/blob/main/src/tests/bruno/

---

### Running the tests

#### From the CLI

In a separate terminal

```
TEST_ENV=true pnpm dev
```

then

```
pnpm test:bruno:local
```

Targets http://localhost:3000, used both locally and by the CI, which first runs a local `pnpm dev`

---

```
pnpm test:bruno:prod
```

Targets https://api.adamik.io, if needed

---

#### From the GUI

1. Install and launch the [Bruno](https://www.usebruno.com/downloads) client
2. Use the "Open Collection" option
3. Select one folder within [/src/tests/bruno/](https://github.com/AdamikHQ/adamik-api/blob/main/src/tests/bruno/)
4. On the top-right corner, select an environment to run the collection against: `localhost` or `api.adamik.io`
5. Repeat 2. 3. and 4. for all folders in [/src/tests/bruno/](https://github.com/AdamikHQ/adamik-api/blob/main/src/tests/bruno/)
6. Select one collection and one endpoint in the collection, then run it (arrow icon on the right)

## Bruno limitations that we had to work around

### Can't run a dataset on individual endpoints in a collection

- :arrow_right: Had to create one collection per API endpoint
- :crossed_fingers: GitHub issue created, but Bruno have not provided any ETA for this...
  https://github.com/usebruno/bruno/issues/3510

### Can't run datasets in JSON format from the bruno CLI... only CSV datasets for now

- :arrow_right: Had to create one endpoint for each dataset
- :crossed_fingers: Bruno have promised to support JSON datasets soon:tm:
