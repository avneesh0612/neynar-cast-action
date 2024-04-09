import { config } from "dotenv";
import { Button, Frog } from "frog";
import { devtools } from "frog/dev";
import { neynar as neynarHub } from "frog/hubs";
import { neynar } from "frog/middlewares";
import { serveStatic } from "frog/serve-static";
import neynarClient from "./lib/neynarClient.js";
config();

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? "";

const ADD_URL =
  "https://warpcast.com/~/add-cast-action?actionType=post&name=followers&icon=person&postUrl=https%3A%2F%2Fd588-2405-201-800c-6a-70a7-56e4-516c-2d3c.ngrok-free.app%2Fapi%2Fgm";

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
        <h2
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
        </h2>
      </div>
    ),
    intents: [<Button.Link href={ADD_URL}>Add Action</Button.Link>],
  });
});

app.hono.post("/gm", async (c) => {
  try {
    const body = await c.req.json();
    const result = await neynarClient.validateFrameAction(
      body.trustedData.messageBytes
    );

    const { users } = await neynarClient.fetchBulkUsers([
      Number(result.action.cast.author.fid),
    ]);

    if (!users) {
      return c.json({ message: "Error. Try Again." }, 500);
    }

    let message = `Count:${users[0].follower_count}`;

    return c.json({ message });
  } catch (e) {
    return c.json({ message: "Error. Try Again." }, 500);
  }
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
