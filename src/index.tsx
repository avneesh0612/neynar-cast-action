import { Button, Frog, TextInput } from "frog";
import { devtools } from "frog/dev";
import { serveStatic } from "frog/serve-static";
import neynarClient from "./lib/neynarClient.js";
import { neynar as neynarHub } from "frog/hubs";
import { neynar } from "frog/middlewares";
import { config } from "dotenv";
config();

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? "";

const ADD_URL =
  "https://warpcast.com/~/add-cast-action?name=gm&icon=thumbsup&actionType=post&postUrl=https://neynar-cast-action.vercel.app/api/gm";

export const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  hub: neynarHub({ apiKey: NEYNAR_API_KEY }),
  browserLocation: ADD_URL,
}).use(
  neynar({
    apiKey: NEYNAR_API_KEY,
    features: ["interactor", "cast"],
  })
);

app.frame("/", (c) => {
  return c.res({
    image: (
      <div
        style={{
          alignItems: "center",
          background: "black",
          backgroundSize: "100% 100%",
          display: "flex",
          flexDirection: "column",
          flexWrap: "nowrap",
          height: "100%",
          justifyContent: "center",
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 60,
            fontStyle: "normal",
            letterSpacing: "-0.025em",
            lineHeight: 1.4,
            marginTop: 30,
            padding: "0 120px",
            whiteSpace: "pre-wrap",
          }}
        >
          gm! Add cast action
        </div>
      </div>
    ),
    intents: [<Button.Link href={ADD_URL}>Add Action</Button.Link>],
  });
});

app.hono.post("/gm", async (c) => {
  console.log(c);
  const body = await c.req.json();

  const interactorFid = body?.message?.data?.fid;
  const castFid = body?.message?.data.frameActionBody.castId?.fid as number;
  if (interactorFid === castFid) {
    return c.json({ message: "Nice try." }, 400);
  }

  const { users } = await neynarClient.fetchBulkUsers([castFid]);

  if (!users) {
    return c.json({ message: "Error. Try Again." }, 500);
  }

  let message = `GM ${users[0].display_name}!`;
  if (message.length > 30) {
    message = "GM!";
  }

  return c.json({ message });
});

app.use("/*", serveStatic({ root: "./public" }));
devtools(app, { serveStatic });

if (typeof Bun !== "undefined") {
  Bun.serve({
    fetch: app.fetch,
    port: 3000,
  });
  console.log("Server is running on port 3000");
}
