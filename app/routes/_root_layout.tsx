import { Outlet } from "react-router";
import appStylesHref from "../App.css?url";
import chatStylesHref from "../chat.css?url";
import indexStylesHref from "../index.css?url";
export const links = () => [
  { rel: "stylesheet", href: indexStylesHref },
  { rel: "stylesheet", href: appStylesHref },
  { rel: "stylesheet", href: chatStylesHref },
];
const RootLayout = () => {
  return (
    <main className="app-root">
      <Outlet />
    </main>
  );
};

export default RootLayout;
