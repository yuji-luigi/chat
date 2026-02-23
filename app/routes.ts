import { type RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default flatRoutes({
  // rootDirectory: "file-routes",
}) satisfies RouteConfig;

// export default [
//   layout("./routes/_root_layout.tsx", [index("./routes/home.tsx")]),

//   layout("./routes/test/_layout.tsx", [
//     route("test", "./routes/test/test.tsx", [
//       route(":id", "./routes/test/id.tsx"),
//     ]),
//   ]),
// ] satisfies RouteConfig;
