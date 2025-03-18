## Usage

### Setup

1. Create a `.env` file from the `.env.sample` provided [here](https://github.com/AdamikHQ/adamik-api/blob/main/src/tests/bruno/.env.sample)
2. Put a valid adamik API key in this `.env` file

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
3. Select the bruno tests folder [/src/tests/bruno/](https://github.com/AdamikHQ/adamik-api/blob/main/src/tests/bruno/)
4. On the top-right corner, select an environment to run the collection against: `localhost` or `api.adamik.io`
6. Select one endpoint in the collection, then run it (arrow icon on the right)

